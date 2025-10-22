/**
 * Feature Store - PostgreSQL Storage Layer
 *
 * Manages time-series feature data in PostgreSQL with daily partitioning.
 * Provides CRUD operations, queries, and retention management.
 *
 * Fortune 500 Standards:
 * - Daily partitioning for query performance
 * - Automatic partition creation ahead of time
 * - Prepared statements for SQL injection prevention
 * - Connection pooling with health checks
 * - Graceful degradation on errors
 *
 * Schema:
 * - features_catalog: Feature metadata
 * - features_values: Time-series data (partitioned by day)
 *
 * @module services/feature-store/storage/pg
 */

import { FeaturePoint } from '../schema/zod';

/**
 * Storage query options
 */
export interface QueryOptions {
  featureIds: string[];
  since?: string; // ISO 8601
  until?: string; // ISO 8601
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

/**
 * Storage write result
 */
export interface WriteResult {
  inserted: number;
  updated: number;
  failed: number;
  errors?: Array<{ featureId: string; reason: string }>;
}

/**
 * Mock PostgreSQL client for dry-run mode
 * In production, this would be replaced with actual Prisma client
 */
class MockPgClient {
  private mockData: Map<string, FeaturePoint[]> = new Map();

  async insertFeaturePoint(point: FeaturePoint): Promise<void> {
    const existing = this.mockData.get(point.featureId) || [];
    // Upsert logic: replace if same timestamp exists
    const filtered = existing.filter(p => p.ts !== point.ts);
    filtered.push(point);
    // Keep sorted by timestamp
    filtered.sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
    this.mockData.set(point.featureId, filtered);
  }

  async queryFeaturePoints(options: QueryOptions): Promise<FeaturePoint[]> {
    const results: FeaturePoint[] = [];

    for (const featureId of options.featureIds) {
      const points = this.mockData.get(featureId) || [];
      let filtered = points;

      // Filter by time range
      if (options.since) {
        const sinceTs = new Date(options.since).getTime();
        filtered = filtered.filter(p => new Date(p.ts).getTime() >= sinceTs);
      }
      if (options.until) {
        const untilTs = new Date(options.until).getTime();
        filtered = filtered.filter(p => new Date(p.ts).getTime() <= untilTs);
      }

      results.push(...filtered);
    }

    // Sort
    results.sort((a, b) => {
      const timeA = new Date(a.ts).getTime();
      const timeB = new Date(b.ts).getTime();
      return options.orderBy === 'asc' ? timeA - timeB : timeB - timeA;
    });

    // Limit
    if (options.limit && results.length > options.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  async getLatestFeaturePoint(featureId: string): Promise<FeaturePoint | null> {
    const points = this.mockData.get(featureId) || [];
    if (points.length === 0) return null;
    return points[points.length - 1]; // Last element (sorted)
  }

  async deleteOldFeaturePoints(
    featureId: string,
    beforeTs: string
  ): Promise<number> {
    const points = this.mockData.get(featureId) || [];
    const beforeTime = new Date(beforeTs).getTime();
    const filtered = points.filter(p => new Date(p.ts).getTime() >= beforeTime);
    const deletedCount = points.length - filtered.length;
    this.mockData.set(featureId, filtered);
    return deletedCount;
  }

  async getFeatureStats(featureId: string): Promise<{
    count: number;
    oldest_ts: string | null;
    newest_ts: string | null;
  }> {
    const points = this.mockData.get(featureId) || [];
    if (points.length === 0) {
      return { count: 0, oldest_ts: null, newest_ts: null };
    }
    return {
      count: points.length,
      oldest_ts: points[0].ts,
      newest_ts: points[points.length - 1].ts,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true; // Mock always healthy
  }
}

/**
 * Global mock client instance
 */
const mockClient = new MockPgClient();

/**
 * Get PostgreSQL client (mock for now)
 *
 * In production, this would return:
 * - Prisma client with connection pooling
 * - Transaction support
 * - Prepared statements
 */
export function getPgClient(): MockPgClient {
  // TODO: In production, initialize Prisma client here
  // const prisma = new PrismaClient({
  //   datasources: { db: { url: process.env.FEATURE_STORE_DATABASE_URL } },
  //   log: ['error', 'warn'],
  // });
  return mockClient;
}

/**
 * Write feature points to PostgreSQL
 *
 * @param points - Array of feature points to write
 * @returns Write result with counts
 */
export async function writeFeaturePoints(
  points: FeaturePoint[]
): Promise<WriteResult> {
  const client = getPgClient();
  const result: WriteResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const point of points) {
    try {
      await client.insertFeaturePoint(point);
      result.inserted += 1;
    } catch (error) {
      result.failed += 1;
      result.errors?.push({
        featureId: point.featureId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Query feature points by time range
 *
 * @param options - Query options
 * @returns Array of feature points
 */
export async function queryFeaturePoints(
  options: QueryOptions
): Promise<FeaturePoint[]> {
  const client = getPgClient();
  return await client.queryFeaturePoints(options);
}

/**
 * Get latest feature point
 *
 * @param featureId - Feature ID
 * @returns Latest feature point or null
 */
export async function getLatestFeaturePoint(
  featureId: string
): Promise<FeaturePoint | null> {
  const client = getPgClient();
  return await client.getLatestFeaturePoint(featureId);
}

/**
 * Delete old feature points (retention management)
 *
 * @param featureId - Feature ID
 * @param beforeTs - Delete points before this timestamp
 * @returns Number of deleted points
 */
export async function deleteOldFeaturePoints(
  featureId: string,
  beforeTs: string
): Promise<number> {
  const client = getPgClient();
  return await client.deleteOldFeaturePoints(featureId, beforeTs);
}

/**
 * Get feature statistics
 *
 * @param featureId - Feature ID
 * @returns Statistics (count, oldest, newest)
 */
export async function getFeatureStats(featureId: string): Promise<{
  count: number;
  oldest_ts: string | null;
  newest_ts: string | null;
}> {
  const client = getPgClient();
  return await client.getFeatureStats(featureId);
}

/**
 * Health check for PostgreSQL connection
 *
 * @returns true if connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getPgClient();
    return await client.healthCheck();
  } catch (error) {
    console.error('[FeatureStore:PG] Health check failed:', error);
    return false;
  }
}

/**
 * Create partitions ahead of time (production only)
 *
 * This would be a cron job in production:
 * - Run daily at midnight
 * - Create partitions for next N days
 * - Handle partition rotation
 *
 * Example SQL:
 * ```sql
 * CREATE TABLE IF NOT EXISTS features_values_2025_10_21
 * PARTITION OF features_values
 * FOR VALUES FROM ('2025-10-21') TO ('2025-10-22');
 * ```
 */
export async function createPartitionsAhead(days: number = 7): Promise<void> {
  console.log(
    `[FeatureStore:PG] Would create partitions for next ${days} days (MOCK)`
  );
  // TODO: Implement actual partition creation in production
}

/**
 * Cleanup old partitions (retention enforcement)
 *
 * This would be a cron job in production:
 * - Run daily at midnight
 * - Drop partitions older than retention period
 * - Archive to S3 before dropping (optional)
 *
 * Example SQL:
 * ```sql
 * DROP TABLE IF EXISTS features_values_2025_07_21;
 * ```
 */
export async function cleanupOldPartitions(
  retentionDays: number = 90
): Promise<void> {
  console.log(
    `[FeatureStore:PG] Would cleanup partitions older than ${retentionDays} days (MOCK)`
  );
  // TODO: Implement actual partition cleanup in production
}
