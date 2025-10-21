/**
 * Feature Store - Data Loaders
 *
 * Orchestrates feature ingestion from multiple data sources.
 * Handles scheduling, error recovery, and incremental updates.
 *
 * Fortune 500 Standards:
 * - Idempotent loads (safe to retry)
 * - Incremental updates (only fetch new data)
 * - Circuit breaker for failing sources
 * - Rate limit awareness
 * - Comprehensive error logging
 *
 * @module services/feature-store/ingest/loaders
 */

import { FeaturePoint, FeatureSpec } from '../schema/zod';
import { getFeatureSpec } from '../registry/catalog';
import {
  getDataSource,
  isRateLimited,
  getRetryDelay,
} from '../registry/contracts';
import { writeFeaturePoints } from '../storage/pg';

/**
 * Load options
 */
export interface LoadOptions {
  featureId: string;
  since?: string; // ISO 8601 - Only fetch data after this timestamp
  until?: string; // ISO 8601 - Only fetch data before this timestamp
  force?: boolean; // Bypass rate limiting and circuit breakers
}

/**
 * Load result
 */
export interface LoadResult {
  featureId: string;
  pointsLoaded: number;
  pointsFailed: number;
  duration_ms: number;
  source: string;
  error?: string;
}

/**
 * Circuit breaker state per source
 */
const circuitBreakerState = new Map<
  string,
  {
    failures: number;
    lastFailure: Date;
    open: boolean;
  }
>();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 60000; // 1 minute

/**
 * Check if circuit breaker is open for source
 */
function isCircuitOpen(sourceId: string): boolean {
  const state = circuitBreakerState.get(sourceId);
  if (!state || !state.open) return false;

  // Auto-reset after timeout
  const elapsed = Date.now() - state.lastFailure.getTime();
  if (elapsed > CIRCUIT_BREAKER_TIMEOUT_MS) {
    state.open = false;
    state.failures = 0;
    return false;
  }

  return true;
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(sourceId: string): void {
  const state = circuitBreakerState.get(sourceId) || {
    failures: 0,
    lastFailure: new Date(),
    open: false,
  };
  state.failures += 1;
  state.lastFailure = new Date();

  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.open = true;
    console.warn(
      `[FeatureStore:Loader] Circuit breaker OPEN for source: ${sourceId}`
    );
  }

  circuitBreakerState.set(sourceId, state);
}

/**
 * Record success for circuit breaker
 */
function recordSuccess(sourceId: string): void {
  const state = circuitBreakerState.get(sourceId);
  if (state) {
    state.failures = 0;
    state.open = false;
  }
}

/**
 * Load feature data from source
 *
 * MOCK IMPLEMENTATION - In production, this would:
 * 1. Fetch spec from catalog
 * 2. Check circuit breaker state
 * 3. Check rate limits
 * 4. Call appropriate adapter
 * 5. Transform and validate data
 * 6. Write to storage
 * 7. Update metrics
 *
 * @param options - Load options
 * @returns Load result
 */
export async function loadFeature(options: LoadOptions): Promise<LoadResult> {
  const startTime = Date.now();
  const { featureId, since, until, force = false } = options;

  try {
    // Get feature spec
    const spec = await getFeatureSpec(featureId);
    if (!spec) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    // Check circuit breaker
    if (!force && isCircuitOpen(spec.source.id)) {
      throw new Error(`Circuit breaker open for source: ${spec.source.id}`);
    }

    // Check rate limits (mock)
    const requestsInLastMinute = 0; // TODO: Track actual requests
    if (!force && (await isRateLimited(spec.source.id, requestsInLastMinute))) {
      const retryDelay = await getRetryDelay(spec.source.id);
      throw new Error(
        `Rate limited for source: ${spec.source.id}. Retry after ${retryDelay}ms`
      );
    }

    // Mock: Generate sample data
    const points = await mockFetchFromSource(spec, since, until);

    // Write to storage
    const writeResult = await writeFeaturePoints(points);

    // Record success
    recordSuccess(spec.source.id);

    const duration = Date.now() - startTime;

    return {
      featureId,
      pointsLoaded: writeResult.inserted,
      pointsFailed: writeResult.failed,
      duration_ms: duration,
      source: spec.source.id,
    };
  } catch (error) {
    const spec = await getFeatureSpec(featureId);
    if (spec) {
      recordFailure(spec.source.id);
    }

    const duration = Date.now() - startTime;

    return {
      featureId,
      pointsLoaded: 0,
      pointsFailed: 0,
      duration_ms: duration,
      source: spec?.source.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch load multiple features
 *
 * @param featureIds - Array of feature IDs to load
 * @param since - Start timestamp (optional)
 * @param until - End timestamp (optional)
 * @returns Array of load results
 */
export async function batchLoadFeatures(
  featureIds: string[],
  since?: string,
  until?: string
): Promise<LoadResult[]> {
  const results: LoadResult[] = [];

  for (const featureId of featureIds) {
    const result = await loadFeature({ featureId, since, until });
    results.push(result);

    // Add small delay between loads to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Mock: Fetch data from source
 *
 * In production, this would delegate to source-specific adapters:
 * - adapters/fred.ts
 * - adapters/defillama.ts
 * - adapters/binance.ts
 * etc.
 */
async function mockFetchFromSource(
  spec: FeatureSpec,
  since?: string,
  until?: string
): Promise<FeaturePoint[]> {
  console.log(
    `[FeatureStore:Loader] Mock fetch: ${spec.id} from ${spec.source.id}`
  );

  // Generate mock points
  const now = new Date();
  const points: FeaturePoint[] = [];

  // Generate 10 mock points
  for (let i = 0; i < 10; i++) {
    const ts = new Date(now.getTime() - i * 3600000); // 1 hour apart

    // Skip if outside time range
    if (since && ts < new Date(since)) continue;
    if (until && ts > new Date(until)) continue;

    points.push({
      featureId: spec.id,
      ts: ts.toISOString(),
      value: Math.random() * 1000,
      stale: false,
      confidence: 0.95,
      evidence: [
        {
          source: spec.source.id,
          ts: ts.toISOString(),
        },
      ],
    });
  }

  return points;
}

/**
 * Get circuit breaker stats
 */
export function getCircuitBreakerStats(): Array<{
  sourceId: string;
  failures: number;
  open: boolean;
  lastFailure: string | null;
}> {
  return Array.from(circuitBreakerState.entries()).map(([sourceId, state]) => ({
    sourceId,
    failures: state.failures,
    open: state.open,
    lastFailure: state.lastFailure.toISOString(),
  }));
}

/**
 * Reset circuit breaker for source
 */
export function resetCircuitBreaker(sourceId: string): void {
  circuitBreakerState.delete(sourceId);
  console.log(
    `[FeatureStore:Loader] Circuit breaker RESET for source: ${sourceId}`
  );
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakerState.clear();
  console.log('[FeatureStore:Loader] All circuit breakers RESET');
}
