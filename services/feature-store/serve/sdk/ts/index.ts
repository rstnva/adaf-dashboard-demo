/**
 * Feature Store TypeScript SDK
 *
 * Cliente oficial para consumir Feature Store desde aplicaciones TypeScript/JavaScript.
 *
 * @module serve/sdk/ts
 *
 * @example
 * ```typescript
 * import { createClient } from '@/services/feature-store/serve/sdk/ts';
 *
 * const client = createClient({
 *   baseUrl: 'https://api.adaf.app/feature-store',
 *   apiKey: process.env.FEATURE_STORE_API_KEY!,
 *   timeout: 10000,
 *   retries: 3,
 *   debug: false,
 * });
 *
 * // Get catalog
 * const catalog = await client.getCatalog({ entity: 'btc' });
 *
 * // Get latest point
 * const latest = await client.getLatest('btc:price:1m');
 *
 * // Query historical data
 * const data = await client.query({
 *   featureId: 'btc:price:1h',
 *   startTs: '2024-01-01T00:00:00Z',
 *   endTs: '2024-01-02T00:00:00Z',
 *   limit: 24,
 * });
 *
 * // Publish new points
 * await client.publish([
 *   {
 *     feature_id: 'btc:price:1m',
 *     value: 50000.0,
 *     ts: new Date().toISOString(),
 *   }
 * ]);
 * ```
 */

// Client
export { FeatureStoreClient, createClient } from './client';

// Types
export type {
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
  FeatureSpec,
  FeaturePoint,
  FeatureEntity,
  FeatureFrequency,
  SourceClass,
} from './types';
