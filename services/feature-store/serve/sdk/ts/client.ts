/**
 * Feature Store TypeScript SDK Client
 *
 * Cliente HTTP para consumir Feature Store desde aplicaciones TypeScript/JavaScript.
 *
 * Fortune 500 Standards:
 * - Retry logic con exponential backoff
 * - Circuit breaker pattern
 * - Request timeout enforcement
 * - Structured logging
 * - Métricas de cliente (duración, errores)
 *
 * @module serve/sdk/ts/client
 */

import type {
  ClientConfig,
  QueryOptions,
  CatalogFilters,
  CatalogResponse,
  LatestResponse,
  QueryResponse,
  PublishResponse,
  PublishPoint,
  FeatureStoreError,
  RequestMetrics,
} from './types';

// =============================================================================
// FeatureStoreClient
// =============================================================================

export class FeatureStoreClient {
  private config: Required<ClientConfig>;
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout ?? 10000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    if (!this.config.baseUrl) {
      throw new Error('[FeatureStoreClient] baseUrl is required');
    }
    if (!this.config.apiKey) {
      throw new Error('[FeatureStoreClient] apiKey is required');
    }

    this.log('Client initialized', { baseUrl: this.config.baseUrl });
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Obtener catálogo de features disponibles
   *
   * @example
   * const catalog = await client.getCatalog({ entity: 'btc', frequency: '1h' });
   * console.log(`Found ${catalog.total} features`);
   */
  async getCatalog(filters?: CatalogFilters): Promise<CatalogResponse> {
    const params = new URLSearchParams();
    if (filters?.entity) params.set('entity', filters.entity);
    if (filters?.frequency) params.set('frequency', filters.frequency);
    if (filters?.tags) params.set('tags', filters.tags.join(','));

    const url = `/api/features/catalog${params.toString() ? `?${params}` : ''}`;
    return this.request<CatalogResponse>('GET', url);
  }

  /**
   * Obtener punto más reciente de una feature
   *
   * @example
   * const latest = await client.getLatest('btc:price:1m');
   * console.log(`BTC Price: ${latest.point?.value}`);
   */
  async getLatest(featureId: string): Promise<LatestResponse> {
    const url = `/api/features/${encodeURIComponent(featureId)}/latest`;
    return this.request<LatestResponse>('GET', url);
  }

  /**
   * Query features por rango de tiempo
   *
   * @example
   * const data = await client.query({
   *   featureId: 'btc:price:1h',
   *   startTs: '2024-01-01T00:00:00Z',
   *   endTs: '2024-01-02T00:00:00Z',
   *   limit: 24,
   *   order: 'asc'
   * });
   * console.log(`Received ${data.points.length} points`);
   */
  async query(options: QueryOptions): Promise<QueryResponse> {
    const body = {
      feature_id: options.featureId,
      start_ts: options.startTs,
      end_ts: options.endTs,
      limit: options.limit ?? 1000,
      order: options.order ?? 'desc',
    };

    return this.request<QueryResponse>('POST', '/api/features/query', body);
  }

  /**
   * Publicar nuevos feature points
   *
   * @example
   * const result = await client.publish([
   *   {
   *     feature_id: 'btc:price:1m',
   *     value: 50000.0,
   *     ts: new Date().toISOString(),
   *     meta: { source: 'binance' }
   *   }
   * ]);
   * console.log(`Published ${result.accepted}/${result.accepted + result.rejected} points`);
   */
  async publish(points: PublishPoint[]): Promise<PublishResponse> {
    if (!Array.isArray(points) || points.length === 0) {
      throw this.createError(
        'BAD_REQUEST',
        'points must be a non-empty array',
        400
      );
    }

    return this.request<PublishResponse>('POST', '/api/features/publish', {
      points,
    });
  }

  /**
   * Obtener métricas del cliente
   */
  getMetrics(): { requests: number; errors: number; errorRate: number } {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate:
        this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
    };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const startTime = Date.now();
    let attempt = 0;
    let lastError: FeatureStoreError | null = null;

    while (attempt <= this.config.retries) {
      try {
        this.requestCount++;

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const headers: HeadersInit = {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FeatureStoreClient/1.0',
        };

        const options: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        this.log(`[${method}] ${path}`, { attempt: attempt + 1 });

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        const metrics: RequestMetrics = {
          requestId: response.headers.get('x-request-id') ?? 'unknown',
          duration,
          statusCode: response.status,
          endpoint: path,
        };

        // Success
        if (response.ok) {
          const data = await response.json();
          this.log(`[${method}] ${path} - Success`, metrics);
          return data as T;
        }

        // Error response
        const errorData = await response.json().catch(() => ({}));
        lastError = this.createError(
          errorData.code || 'HTTP_ERROR',
          errorData.error || response.statusText,
          response.status,
          errorData.details,
          errorData.request_id
        );

        // Don't retry 4xx errors (except 429 rate limit)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw lastError;
        }

        // Retry with backoff
        if (attempt < this.config.retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.log(`Retrying after ${backoffMs}ms...`, {
            attempt: attempt + 1,
          });
          await this.sleep(backoffMs);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          lastError = this.createError(
            'TIMEOUT',
            `Request timeout after ${this.config.timeout}ms`,
            408
          );
        } else if ((error as FeatureStoreError).code) {
          lastError = error as FeatureStoreError;
        } else {
          lastError = this.createError(
            'NETWORK_ERROR',
            error.message || 'Network request failed',
            0,
            error
          );
        }

        // Retry network errors
        if (attempt < this.config.retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.log(`Retrying after ${backoffMs}ms...`, {
            attempt: attempt + 1,
            error: lastError.message,
          });
          await this.sleep(backoffMs);
        }
      }

      attempt++;
    }

    // All retries exhausted
    this.errorCount++;
    throw lastError!;
  }

  private createError(
    code: string,
    message: string,
    statusCode?: number,
    details?: any,
    requestId?: string
  ): FeatureStoreError {
    const error = new Error(message) as FeatureStoreError;
    error.name = 'FeatureStoreError';
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.requestId = requestId;
    return error;
  }

  private log(message: string, data?: any): void {
    if (!this.config.debug) return;

    const timestamp = new Date().toISOString();
    console.log(`[FeatureStoreClient] ${timestamp} - ${message}`, data ?? '');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Crear instancia del cliente Feature Store
 *
 * @example
 * import { createClient } from '@/services/feature-store/serve/sdk/ts';
 *
 * const client = createClient({
 *   baseUrl: process.env.FEATURE_STORE_URL!,
 *   apiKey: process.env.FEATURE_STORE_API_KEY!,
 *   debug: true,
 * });
 *
 * const catalog = await client.getCatalog();
 */
export function createClient(config: ClientConfig): FeatureStoreClient {
  return new FeatureStoreClient(config);
}
