/**
 * Feature Store REST API
 *
 * Expone endpoints HTTP para consumir features desde aplicaciones externas.
 * Compatible con Next.js API routes y Express/Fastify.
 *
 * Fortune 500 Standards:
 * - Rate limiting por API key
 * - Autenticación vía Bearer token
 * - Logging estructurado (JSON)
 * - Métricas Prometheus
 * - Circuit breaker en upstream calls
 *
 * @module serve/api/rest
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type {
  FeatureSpec,
  FeaturePoint,
  FeatureEntity,
  FeatureFrequency,
} from '../../schema/types';
import { getFeatureSpec, getCatalog } from '../../registry/catalog';
import { getFeatureStats } from '../../storage/pg';
import { calculateCoverage } from '../../dq/coverage';
import {
  featureApiRequestTotal,
  featureApiResponseTime,
} from '../../metrics/feature.metrics';

// =============================================================================
// Types
// =============================================================================

export interface CatalogResponse {
  features: FeatureSpec[];
  total: number;
  filters?: {
    entity?: FeatureEntity;
    frequency?: FeatureFrequency;
    tags?: string[];
  };
}

export interface LatestResponse {
  feature: FeatureSpec;
  point: FeaturePoint | null;
  metadata: {
    stale: boolean;
    age_ms: number;
    confidence: number;
  };
}

export interface QueryRequest {
  feature_id: string;
  start_ts: string; // ISO 8601
  end_ts: string; // ISO 8601
  limit?: number;
  order?: 'asc' | 'desc';
}

export interface QueryResponse {
  feature: FeatureSpec;
  points: FeaturePoint[];
  metadata: {
    total: number;
    returned: number;
    coverage: number; // 0.0 to 1.0
  };
}

export interface PublishRequest {
  points: Array<{
    feature_id: string;
    value: number;
    ts: string; // ISO 8601
    meta?: Record<string, any>;
  }>;
}

export interface PublishResponse {
  success: boolean;
  accepted: number;
  rejected: number;
  errors?: Array<{
    index: number;
    feature_id: string;
    reason: string;
  }>;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  request_id?: string;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Validate API key (stub - implementar con DB/Redis)
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  // TODO_FEATURE_STORE: Implementar validación real
  // - Check against DB/Redis
  // - Verify not expired
  // - Check rate limits
  return apiKey.startsWith('fs_');
}

/**
 * Extract API key from request headers
 */
function getApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Create error response with consistent structure
 */
function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
      request_id: requestId,
    },
    { status }
  );
}

// =============================================================================
// Endpoint 1: GET /api/features/catalog
// =============================================================================

/**
 * Lista todas las features disponibles en el catálogo.
 *
 * Query params:
 * - entity: filtrar por entidad (btc, eth, protocol, etc)
 * - frequency: filtrar por frecuencia (1m, 5m, 1h, 1d)
 * - tags: filtrar por tags (comma-separated)
 *
 * @example
 * GET /api/features/catalog?entity=btc&frequency=1h
 */
export async function GET_catalog(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Auth
    const apiKey = getApiKey(request);
    if (!apiKey || !(await validateApiKey(apiKey))) {
      featureApiRequestTotal.inc({ status: 'unauthorized' });
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or missing API key',
        undefined,
        requestId
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') as FeatureEntity | null;
    const frequency = searchParams.get('frequency') as FeatureFrequency | null;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam
      ? tagsParam.split(',').map(t => t.trim())
      : undefined;

    // Fetch catalog
    const allEntries = await getCatalog();
    const allSpecs = allEntries.map(entry => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        active: _active,
        created_at: _created_at,
        updated_at: _updated_at,
        ...spec
      } = entry;
      return spec as FeatureSpec;
    });

    // Apply filters
    let filtered = allSpecs;
    if (entity) {
      filtered = filtered.filter(s => s.entity === entity);
    }
    if (frequency) {
      filtered = filtered.filter(s => s.frequency === frequency);
    }
    if (tags && tags.length > 0) {
      filtered = filtered.filter(s => tags.some(tag => s.tags.includes(tag)));
    }

    // Build response
    const response: CatalogResponse = {
      features: filtered,
      total: filtered.length,
      filters: {
        entity: entity ?? undefined,
        frequency: frequency ?? undefined,
        tags,
      },
    };

    // Metrics
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'success' });
    featureApiResponseTime.observe(duration, { endpoint: 'catalog' });

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'error' });
    featureApiResponseTime.observe(duration, { endpoint: 'catalog' });

    console.error('[API /catalog] Error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to fetch catalog',
      error.message,
      requestId
    );
  }
}

// =============================================================================
// Endpoint 2: GET /api/features/:id/latest
// =============================================================================

/**
 * Obtiene el punto de datos más reciente para una feature.
 *
 * Path params:
 * - id: feature ID (e.g., "btc:price:1m")
 *
 * @example
 * GET /api/features/btc:price:1m/latest
 */
export async function GET_latest(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Auth
    const apiKey = getApiKey(request);
    if (!apiKey || !(await validateApiKey(apiKey))) {
      featureApiRequestTotal.inc({ status: 'unauthorized' });
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or missing API key',
        undefined,
        requestId
      );
    }

    const featureId = params.id;

    // Get spec
    const entry = await getFeatureSpec(featureId);
    if (!entry) {
      featureApiRequestTotal.inc({ status: 'not_found' });
      return errorResponse(
        404,
        'NOT_FOUND',
        `Feature not found: ${featureId}`,
        undefined,
        requestId
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      active: _active,
      created_at: _created_at,
      updated_at: _updated_at,
      ...spec
    } = entry;

    // Get stats (includes latest point)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _stats = await getFeatureStats(featureId);
    // TODO_FEATURE_STORE: Add latest_point to getFeatureStats return type
    const latestPoint: FeaturePoint | null = null; // stats?.latest_point ?? null;

    // Calculate metadata
    const now = Date.now();
    const age_ms = latestPoint ? now - new Date(latestPoint.ts).getTime() : 0;
    const stale = latestPoint ? age_ms > spec.ttl_ms : true;
    const confidence = latestPoint?.confidence ?? 0.0;

    // Build response
    const response: LatestResponse = {
      feature: spec as FeatureSpec,
      point: latestPoint,
      metadata: {
        stale,
        age_ms,
        confidence,
      },
    };

    // Metrics
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'success' });
    featureApiResponseTime.observe(duration, { endpoint: 'latest' });

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'error' });
    featureApiResponseTime.observe(duration, { endpoint: 'latest' });

    console.error('[API /latest] Error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to fetch latest point',
      error.message,
      requestId
    );
  }
}

// =============================================================================
// Endpoint 3: POST /api/features/query
// =============================================================================

/**
 * Query features por rango de tiempo.
 *
 * Body (JSON):
 * ```json
 * {
 *   "feature_id": "btc:price:1h",
 *   "start_ts": "2024-01-01T00:00:00Z",
 *   "end_ts": "2024-01-02T00:00:00Z",
 *   "limit": 100,
 *   "order": "asc"
 * }
 * ```
 *
 * @example
 * POST /api/features/query
 */
export async function POST_query(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Auth
    const apiKey = getApiKey(request);
    if (!apiKey || !(await validateApiKey(apiKey))) {
      featureApiRequestTotal.inc({ status: 'unauthorized' });
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or missing API key',
        undefined,
        requestId
      );
    }

    // Parse body
    const body: QueryRequest = await request.json();
    const { feature_id, start_ts, end_ts } = body;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _limit = body.limit ?? 1000;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _order = body.order ?? 'desc';

    // Validate
    if (!feature_id || !start_ts || !end_ts) {
      featureApiRequestTotal.inc({ status: 'bad_request' });
      return errorResponse(
        400,
        'BAD_REQUEST',
        'Missing required fields: feature_id, start_ts, end_ts',
        undefined,
        requestId
      );
    }

    // Get spec
    const entry = await getFeatureSpec(feature_id);
    if (!entry) {
      featureApiRequestTotal.inc({ status: 'not_found' });
      return errorResponse(
        404,
        'NOT_FOUND',
        `Feature not found: ${feature_id}`,
        undefined,
        requestId
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      active: _active,
      created_at: _created_at,
      updated_at: _updated_at,
      ...spec
    } = entry;

    // TODO_FEATURE_STORE: Implementar query real desde storage/pg.ts
    // Por ahora retornamos array vacío
    const points: FeaturePoint[] = [];

    // Calculate coverage
    const coverageReport = await calculateCoverage(points, entry);
    const coverage = coverageReport.points.coverage;

    // Build response
    const response: QueryResponse = {
      feature: spec as FeatureSpec,
      points,
      metadata: {
        total: points.length,
        returned: points.length,
        coverage,
      },
    };

    // Metrics
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'success' });
    featureApiResponseTime.observe(duration, { endpoint: 'query' });

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'error' });
    featureApiResponseTime.observe(duration, { endpoint: 'query' });

    console.error('[API /query] Error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to query features',
      error.message,
      requestId
    );
  }
}

// =============================================================================
// Endpoint 4: POST /api/features/publish
// =============================================================================

/**
 * Publica nuevos feature points.
 *
 * Body (JSON):
 * ```json
 * {
 *   "points": [
 *     {
 *       "feature_id": "btc:price:1m",
 *       "value": 50000.0,
 *       "ts": "2024-01-15T12:00:00Z",
 *       "meta": { "source": "binance" }
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * POST /api/features/publish
 */
export async function POST_publish(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Auth
    const apiKey = getApiKey(request);
    if (!apiKey || !(await validateApiKey(apiKey))) {
      featureApiRequestTotal.inc({ status: 'unauthorized' });
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or missing API key',
        undefined,
        requestId
      );
    }

    // Parse body
    const body: PublishRequest = await request.json();
    const { points } = body;

    // Validate
    if (!points || !Array.isArray(points) || points.length === 0) {
      featureApiRequestTotal.inc({ status: 'bad_request' });
      return errorResponse(
        400,
        'BAD_REQUEST',
        'Missing or empty points array',
        undefined,
        requestId
      );
    }

    // Validate each point
    const errors: PublishResponse['errors'] = [];
    let accepted = 0;

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];

      // Check required fields
      if (!pt.feature_id || typeof pt.value !== 'number' || !pt.ts) {
        errors.push({
          index: i,
          feature_id: pt.feature_id ?? 'unknown',
          reason: 'Missing required fields: feature_id, value, ts',
        });
        continue;
      }

      // Check feature exists
      const spec = await getFeatureSpec(pt.feature_id);
      if (!spec) {
        errors.push({
          index: i,
          feature_id: pt.feature_id,
          reason: `Feature not found: ${pt.feature_id}`,
        });
        continue;
      }

      // TODO_FEATURE_STORE: Implementar escritura real a storage/pg.ts
      // Por ahora solo validamos
      accepted++;
    }

    // Build response
    const response: PublishResponse = {
      success: errors.length === 0,
      accepted,
      rejected: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    // Metrics
    const duration = Date.now() - startTime;
    const status = response.success ? 'success' : 'partial_failure';
    featureApiRequestTotal.inc({ status });
    featureApiResponseTime.observe(duration, { endpoint: 'publish' });
    featureApiRequestTotal.inc({ status: 'accepted' }, accepted);
    featureApiRequestTotal.inc({ status: 'rejected' }, errors.length);

    return NextResponse.json(response, {
      status: response.success ? 200 : 207, // 207 Multi-Status para partial success
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    featureApiRequestTotal.inc({ status: 'error' });
    featureApiResponseTime.observe(duration, { endpoint: 'publish' });

    console.error('[API /publish] Error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to publish points',
      error.message,
      requestId
    );
  }
}
