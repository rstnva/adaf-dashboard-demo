/**
 * Feature Store - Data Source Contracts
 *
 * Manages data source metadata and contracts.
 * Provides interface for source reliability, rate limits, and schemas.
 *
 * Fortune 500 Standards:
 * - No secrets in contract metadata (use env vars)
 * - Rate limit awareness for all sources
 * - Reliability tracking for circuit breaker decisions
 * - Schema versioning for backward compatibility
 *
 * @module services/feature-store/registry/contracts
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Data source metadata
 */
export interface DataSourceContract {
  id: string;
  name: string;
  class: 'onchain' | 'cex' | 'macro' | 'derived';
  base_url: string;
  rate_limit_rpm: number;
  auth_type: 'none' | 'api_key' | 'oauth' | 'internal';
  schema_version: string;
  reliability: number; // 0.0 to 1.0
  avg_latency_ms: number;
  tags: string[];
}

/**
 * Data sources registry metadata
 */
export interface DataSourcesRegistry {
  datasources: DataSourceContract[];
  metadata: {
    version: string;
    last_updated: string;
    total_sources: number;
    active_sources: number;
  };
}

/**
 * In-memory cache for data sources
 */
let sourcesCache: Map<string, DataSourceContract> | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL_MS = 300000; // 5 minutes

/**
 * Load data sources from JSON file
 */
async function loadSourcesFromFile(): Promise<DataSourcesRegistry> {
  const sourcesPath = path.join(
    process.cwd(),
    'services/feature-store/registry/datasources.json'
  );

  try {
    const raw = await fs.readFile(sourcesPath, 'utf-8');
    const registry: DataSourcesRegistry = JSON.parse(raw);

    // Validate structure
    if (!registry.datasources || !Array.isArray(registry.datasources)) {
      throw new Error('Invalid datasources.json structure');
    }

    return registry;
  } catch (error) {
    console.error('[FeatureStore] Failed to load data sources:', error);
    throw new Error(
      `Data sources load failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all data sources with caching
 */
export async function getDataSources(): Promise<DataSourceContract[]> {
  const now = Date.now();

  // Return cached if fresh
  if (sourcesCache && now - lastLoadTime < CACHE_TTL_MS) {
    return Array.from(sourcesCache.values());
  }

  // Reload from file
  const registry = await loadSourcesFromFile();
  sourcesCache = new Map(registry.datasources.map(s => [s.id, s]));
  lastLoadTime = now;

  return registry.datasources;
}

/**
 * Get single data source by ID
 */
export async function getDataSource(
  sourceId: string
): Promise<DataSourceContract | null> {
  const sources = await getDataSources();
  return sources.find(s => s.id === sourceId) || null;
}

/**
 * Get data sources by class
 */
export async function getDataSourcesByClass(
  sourceClass: string
): Promise<DataSourceContract[]> {
  const sources = await getDataSources();
  return sources.filter(s => s.class === sourceClass);
}

/**
 * Check if source is rate-limited
 *
 * @param sourceId - Data source ID
 * @param requestsInLastMinute - Number of requests in the last minute
 * @returns true if rate limit exceeded
 */
export async function isRateLimited(
  sourceId: string,
  requestsInLastMinute: number
): Promise<boolean> {
  const source = await getDataSource(sourceId);
  if (!source) return true; // Unknown source, assume rate limited

  return requestsInLastMinute >= source.rate_limit_rpm;
}

/**
 * Get recommended retry delay for source
 *
 * @param sourceId - Data source ID
 * @returns Retry delay in milliseconds
 */
export async function getRetryDelay(sourceId: string): Promise<number> {
  const source = await getDataSource(sourceId);
  if (!source) return 60000; // 1 minute default

  // Base retry on avg latency and rate limit
  const baseDelay = source.avg_latency_ms * 2;
  const rateLimitDelay = (60000 / source.rate_limit_rpm) * 1.5;

  return Math.max(baseDelay, rateLimitDelay);
}

/**
 * Check if source is reliable enough for production use
 *
 * @param sourceId - Data source ID
 * @param minReliability - Minimum reliability threshold (default: 0.95)
 * @returns true if source meets reliability threshold
 */
export async function isSourceReliable(
  sourceId: string,
  minReliability: number = 0.95
): Promise<boolean> {
  const source = await getDataSource(sourceId);
  if (!source) return false;

  return source.reliability >= minReliability;
}

/**
 * Get data sources statistics
 */
export async function getDataSourcesStats(): Promise<{
  total: number;
  by_class: Record<string, number>;
  by_auth: Record<string, number>;
  avg_reliability: number;
  avg_latency_ms: number;
}> {
  const sources = await getDataSources();

  const stats = {
    total: sources.length,
    by_class: {} as Record<string, number>,
    by_auth: {} as Record<string, number>,
    avg_reliability: 0,
    avg_latency_ms: 0,
  };

  let totalReliability = 0;
  let totalLatency = 0;

  sources.forEach(source => {
    // Count by class
    stats.by_class[source.class] = (stats.by_class[source.class] || 0) + 1;

    // Count by auth type
    stats.by_auth[source.auth_type] =
      (stats.by_auth[source.auth_type] || 0) + 1;

    // Sum for averages
    totalReliability += source.reliability;
    totalLatency += source.avg_latency_ms;
  });

  stats.avg_reliability =
    sources.length > 0 ? totalReliability / sources.length : 0;
  stats.avg_latency_ms = sources.length > 0 ? totalLatency / sources.length : 0;

  return stats;
}

/**
 * Force reload data sources from file (bypass cache)
 */
export async function reloadDataSources(): Promise<void> {
  sourcesCache = null;
  lastLoadTime = 0;
  await getDataSources(); // Trigger reload
}
