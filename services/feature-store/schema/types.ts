/**
 * @fileoverview Feature Store Core Types
 * @module services/feature-store/schema/types
 *
 * Fortune 500 Standards:
 * - Strict typing for data contracts
 * - Version control for schema evolution
 * - Comprehensive metadata for observability
 * - Evidence tracking for audit trails
 */

/**
 * Feature entity classification
 */
export type FeatureEntity = 'asset' | 'pair' | 'market' | 'macro';

/**
 * Feature update frequency
 */
export type FeatureFrequency = 'tick' | '1m' | '5m' | '1h' | '1d';

/**
 * Data source classification
 */
export type SourceClass = 'onchain' | 'cex' | 'macro' | 'derived';

/**
 * Feature specification - defines a feature's metadata and characteristics
 */
export interface FeatureSpec {
  /** Unique feature identifier (e.g., "macro/us/walcl_total_usd") */
  id: string;

  /** Entity type this feature describes */
  entity: FeatureEntity;

  /** Human-readable description */
  description: string;

  /** Unit of measurement (e.g., 'USD', 'ratio', 'bps', 'index') */
  unit: string;

  /** Update frequency */
  frequency: FeatureFrequency;

  /** Time-to-live in milliseconds - staleness threshold */
  ttl_ms: number;

  /** Categorization tags (e.g., ['macro', 'liquidity']) */
  tags: string[];

  /** Data source information */
  source: {
    /** Source identifier */
    id: string;
    /** Source classification */
    class: SourceClass;
    /** Source schema version */
    schema: string;
  };

  /** Optional quality constraints */
  quality?: {
    /** Expected value range [min, max] */
    expected_range?: [number, number];
    /** Whether feature exhibits seasonal patterns */
    seasonal?: boolean;
  };

  /** Schema version for evolution */
  version: number;
}

/**
 * Evidence reference for data provenance
 */
export interface EvidenceRef {
  /** Source identifier */
  source_id: string;
  /** Capture timestamp ISO 8601 */
  captured_at: string;
  /** Optional source URL */
  url?: string;
  /** Optional data hash for integrity */
  hash?: string;
}

/**
 * Feature data point - a single time-series observation
 */
export interface FeaturePoint {
  /** Feature identifier */
  featureId: string;

  /** Timestamp ISO 8601 */
  ts: string;

  /** Feature value */
  value: number;

  /** Whether data is stale (exceeds TTL) */
  stale: boolean;

  /** Confidence score 0..1 */
  confidence: number;

  /** Optional metadata (e.g., revisions, provider) */
  meta?: Record<string, any>;

  /** Optional evidence trail for audit */
  evidence?: EvidenceRef[];
}

/**
 * Feature query parameters
 */
export interface FeatureQuery {
  /** Feature IDs to query */
  featureIds: string[];

  /** Optional start timestamp ISO 8601 */
  since?: string;

  /** Optional end timestamp ISO 8601 */
  until?: string;

  /** Optional aggregation function */
  agg?: 'avg' | 'sum' | 'min' | 'max' | 'last';

  /** Optional limit on results */
  limit?: number;
}

/**
 * Feature query result
 */
export interface FeatureQueryResult {
  /** Queried feature ID */
  featureId: string;

  /** Data points */
  points: FeaturePoint[];

  /** Query metadata */
  meta: {
    /** Total points matched */
    total: number;
    /** Whether result is truncated */
    truncated: boolean;
    /** Query execution time ms */
    duration_ms: number;
  };
}

/**
 * Feature catalog entry for registry
 */
export interface CatalogEntry extends FeatureSpec {
  /** Creation timestamp */
  created_at: string;

  /** Last update timestamp */
  updated_at: string;

  /** Whether feature is active */
  active: boolean;

  /** Optional deprecation info */
  deprecated?: {
    reason: string;
    since: string;
    replacement?: string;
  };
}

/**
 * Data source specification
 */
export interface DataSourceSpec {
  /** Source identifier */
  id: string;

  /** Source classification */
  class: SourceClass;

  /** Source name */
  name: string;

  /** Description */
  description: string;

  /** Base URL or endpoint */
  endpoint?: string;

  /** Authentication method */
  auth?: 'none' | 'bearer' | 'api_key' | 'oauth';

  /** Rate limit (requests per minute) */
  rate_limit_rpm?: number;

  /** Whether source is active */
  active: boolean;

  /** Optional cost per request (for budgeting) */
  cost_per_req?: number;
}

/**
 * Feature Store health status
 */
export interface FeatureStoreHealth {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'down';

  /** Total features in catalog */
  total_features: number;

  /** Active features */
  active_features: number;

  /** Features with stale data */
  stale_features: number;

  /** Storage health */
  storage: {
    pg_status: 'up' | 'down';
    s3_status: 'up' | 'down';
  };

  /** Last health check timestamp */
  checked_at: string;
}
