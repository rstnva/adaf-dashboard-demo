/**
 * TypeScript SDK Types
 *
 * Tipos específicos del SDK cliente (pueden diferir ligeramente del schema interno).
 *
 * @module serve/sdk/ts/types
 */

// Re-export core types
export type {
  FeatureSpec,
  FeaturePoint,
  FeatureEntity,
  FeatureFrequency,
  SourceClass,
} from '../../../schema/types';

// =============================================================================
// Client Configuration
// =============================================================================

export interface ClientConfig {
  /**
   * Base URL del Feature Store API
   * @example "https://api.adaf.app/feature-store"
   */
  baseUrl: string;

  /**
   * API key para autenticación
   * @example "fs_live_abc123..."
   */
  apiKey: string;

  /**
   * Timeout para requests HTTP (ms)
   * @default 10000
   */
  timeout?: number;

  /**
   * Número de reintentos en caso de fallo
   * @default 3
   */
  retries?: number;

  /**
   * Habilitar logging de requests
   * @default false
   */
  debug?: boolean;
}

// =============================================================================
// Query Options
// =============================================================================

export interface QueryOptions {
  /**
   * Feature ID a consultar
   * @example "btc:price:1h"
   */
  featureId: string;

  /**
   * Timestamp de inicio (ISO 8601)
   * @example "2024-01-01T00:00:00Z"
   */
  startTs: string;

  /**
   * Timestamp de fin (ISO 8601)
   * @example "2024-01-02T00:00:00Z"
   */
  endTs: string;

  /**
   * Límite de puntos a retornar
   * @default 1000
   */
  limit?: number;

  /**
   * Orden de los resultados
   * @default "desc"
   */
  order?: 'asc' | 'desc';
}

export interface CatalogFilters {
  /**
   * Filtrar por entidad
   * @example "btc"
   */
  entity?: string;

  /**
   * Filtrar por frecuencia
   * @example "1h"
   */
  frequency?: string;

  /**
   * Filtrar por tags
   * @example ["price", "onchain"]
   */
  tags?: string[];
}

// =============================================================================
// Response Types
// =============================================================================

export interface CatalogResponse {
  features: any[]; // FeatureSpec[]
  total: number;
  filters?: CatalogFilters;
}

export interface LatestResponse {
  feature: any; // FeatureSpec
  point: any | null; // FeaturePoint | null
  metadata: {
    stale: boolean;
    age_ms: number;
    confidence: number;
  };
}

export interface QueryResponse {
  feature: any; // FeatureSpec
  points: any[]; // FeaturePoint[]
  metadata: {
    total: number;
    returned: number;
    coverage: number;
  };
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

// =============================================================================
// SDK-specific Types
// =============================================================================

export interface FeatureStoreError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
  requestId?: string;
}

export interface PublishPoint {
  feature_id: string;
  value: number;
  ts: string; // ISO 8601
  meta?: Record<string, any>;
}

export interface RequestMetrics {
  requestId: string;
  duration: number;
  statusCode: number;
  endpoint: string;
}
