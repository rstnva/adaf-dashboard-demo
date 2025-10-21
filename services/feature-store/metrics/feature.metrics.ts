/**
 * Feature Store - Prometheus Metrics
 *
 * Exposes Feature Store metrics for monitoring and alerting:
 * - Ingestion: load rate, failures, duration
 * - DQ: coverage, freshness, violations
 * - Storage: size, query performance
 * - Usage: API calls, SDK requests
 *
 * Fortune 500 Standards:
 * - Standard Prometheus metric types (Counter, Gauge, Histogram)
 * - Cardinality awareness (avoid high-cardinality labels)
 * - Clear metric naming (feature_store_*)
 * - Comprehensive help text
 *
 * @module services/feature-store/metrics/feature.metrics
 */

/**
 * Mock Prometheus client
 *
 * In production, use 'prom-client' library:
 * ```
 * import { Counter, Gauge, Histogram, Registry } from 'prom-client';
 * ```
 */

interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

class MockCounter {
  private values: MetricValue[] = [];

  constructor(
    private _name: string,
    private _help: string
  ) {}

  inc(labels: Record<string, string> = {}, value: number = 1): void {
    this.values.push({
      value,
      labels,
      timestamp: Date.now(),
    });
    console.log(`[Metrics:Counter] ${this._name}:`, labels, value);
  }

  reset(): void {
    this.values = [];
  }
}

class MockGauge {
  private value: number = 0;
  private labels: Record<string, string> = {};

  constructor(
    private _name: string,
    private _help: string
  ) {}

  set(value: number, labels: Record<string, string> = {}): void {
    this.value = value;
    this.labels = labels;
    console.log(`[Metrics:Gauge] ${this._name}:`, labels, value);
  }

  inc(labels: Record<string, string> = {}, value: number = 1): void {
    this.value += value;
    this.labels = labels;
    console.log(`[Metrics:Gauge] ${this._name} +${value}:`, labels, this.value);
  }

  dec(labels: Record<string, string> = {}, value: number = 1): void {
    this.value -= value;
    this.labels = labels;
    console.log(`[Metrics:Gauge] ${this._name} -${value}:`, labels, this.value);
  }

  get(): number {
    return this.value;
  }
}

class MockHistogram {
  private observations: number[] = [];

  constructor(
    private _name: string,
    private _help: string
  ) {}

  observe(value: number, labels: Record<string, string> = {}): void {
    this.observations.push(value);
    console.log(`[Metrics:Histogram] ${this._name}:`, labels, value);
  }

  reset(): void {
    this.observations = [];
  }
}

// ================================
// Ingestion Metrics
// ================================

/**
 * Counter: Total feature ingestion attempts
 */
export const featureIngestTotal = new MockCounter(
  'feature_ingest_total',
  'Total number of feature ingestion attempts'
);

/**
 * Counter: Failed feature ingestions
 */
export const featureIngestFailTotal = new MockCounter(
  'feature_ingest_fail_total',
  'Total number of failed feature ingestions'
);

/**
 * Histogram: Feature ingestion duration
 */
export const featureIngestDuration = new MockHistogram(
  'feature_ingest_duration_seconds',
  'Duration of feature ingestion in seconds'
);

/**
 * Gauge: Feature freshness (age of latest data point)
 */
export const featureFreshnessSeconds = new MockGauge(
  'feature_freshness_seconds',
  'Age of latest feature data point in seconds'
);

/**
 * Gauge: Feature coverage ratio
 */
export const featureCoverageRatio = new MockGauge(
  'feature_coverage_ratio',
  'Feature data coverage ratio (0.0 to 1.0)'
);

// ================================
// DQ Metrics
// ================================

/**
 * Counter: Total DQ violations
 */
export const featureDqViolationTotal = new MockCounter(
  'feature_dq_violation_total',
  'Total number of DQ violations'
);

/**
 * Gauge: Active DQ violations
 */
export const featureDqViolationActive = new MockGauge(
  'feature_dq_violation_active',
  'Number of active DQ violations'
);

// ================================
// Storage Metrics
// ================================

/**
 * Gauge: Storage size in bytes
 */
export const featureStorageSizeBytes = new MockGauge(
  'feature_storage_size_bytes',
  'Storage size in bytes by layer (pg, s3, parquet)'
);

/**
 * Histogram: Query duration
 */
export const featureQueryDuration = new MockHistogram(
  'feature_query_duration_seconds',
  'Duration of feature queries in seconds'
);

/**
 * Counter: Query total
 */
export const featureQueryTotal = new MockCounter(
  'feature_query_total',
  'Total number of feature queries'
);

// ================================
// API Metrics
// ================================

/**
 * Counter: API requests
 */
export const featureApiRequestTotal = new MockCounter(
  'feature_api_request_total',
  'Total number of Feature Store API requests'
);

/**
 * Histogram: API response time
 */
export const featureApiResponseTime = new MockHistogram(
  'feature_api_response_time_seconds',
  'API response time in seconds'
);

/**
 * Counter: API errors
 */
export const featureApiErrorTotal = new MockCounter(
  'feature_api_error_total',
  'Total number of API errors'
);

// ================================
// Helper Functions
// ================================

/**
 * Record feature ingestion
 */
export function recordIngestion(
  featureId: string,
  success: boolean,
  durationMs: number,
  pointsLoaded: number
): void {
  featureIngestTotal.inc({ feature: featureId }, pointsLoaded);

  if (!success) {
    featureIngestFailTotal.inc({ feature: featureId });
  }

  featureIngestDuration.observe(durationMs / 1000, { feature: featureId });
}

/**
 * Record feature freshness
 */
export function recordFreshness(featureId: string, ageSeconds: number): void {
  featureFreshnessSeconds.set(ageSeconds, { feature: featureId });
}

/**
 * Record feature coverage
 */
export function recordCoverage(featureId: string, coverage: number): void {
  featureCoverageRatio.set(coverage, { feature: featureId });
}

/**
 * Record DQ violation
 */
export function recordDQViolation(
  featureId: string,
  rule: string,
  severity: string
): void {
  featureDqViolationTotal.inc({ feature: featureId, rule, severity });
  featureDqViolationActive.inc({ feature: featureId, rule, severity });
}

/**
 * Clear DQ violation
 */
export function clearDQViolation(
  featureId: string,
  rule: string,
  severity: string
): void {
  featureDqViolationActive.dec({ feature: featureId, rule, severity });
}

/**
 * Record storage size
 */
export function recordStorageSize(layer: string, sizeBytes: number): void {
  featureStorageSizeBytes.set(sizeBytes, { layer });
}

/**
 * Record query
 */
export function recordQuery(
  endpoint: string,
  durationMs: number,
  success: boolean
): void {
  featureQueryTotal.inc({ endpoint, status: success ? 'success' : 'error' });
  featureQueryDuration.observe(durationMs / 1000, { endpoint });
}

/**
 * Record API request
 */
export function recordApiRequest(
  method: string,
  endpoint: string,
  statusCode: number,
  durationMs: number
): void {
  featureApiRequestTotal.inc({
    method,
    endpoint,
    status: statusCode.toString(),
  });
  featureApiResponseTime.observe(durationMs / 1000, { method, endpoint });

  if (statusCode >= 400) {
    featureApiErrorTotal.inc({
      method,
      endpoint,
      status: statusCode.toString(),
    });
  }
}

/**
 * Get metrics snapshot (for testing/debugging)
 */
export function getMetricsSnapshot(): Record<string, unknown> {
  return {
    ingest_total: featureIngestTotal,
    ingest_fail_total: featureIngestFailTotal,
    freshness_seconds: featureFreshnessSeconds.get(),
    coverage_ratio: featureCoverageRatio.get(),
    dq_violation_active: featureDqViolationActive.get(),
  };
}

/**
 * Reset all metrics (for testing)
 */
export function resetAllMetrics(): void {
  featureIngestTotal.reset();
  featureIngestFailTotal.reset();
  featureIngestDuration.reset();
  featureQueryTotal.reset();
  featureQueryDuration.reset();
  featureApiRequestTotal.reset();
  featureApiResponseTime.reset();
  featureApiErrorTotal.reset();
}
