/**
 * Feature Store - Zod Validation Schemas
 *
 * Validates all Feature Store contracts at runtime to ensure data integrity.
 * Enforces strict typing for FeatureSpec, FeaturePoint, queries, and catalog entries.
 *
 * Fortune 500 Standards:
 * - Fail-fast validation with detailed error messages
 * - ISO 8601 timestamps with timezone awareness
 * - Range validation for confidence scores
 * - Enum constraints for entity types and frequencies
 *
 * @module services/feature-store/schema/zod
 */

import { z } from 'zod';

// ================================
// Core Type Schemas
// ================================

/**
 * Entity types for feature categorization
 */
export const EntitySchema = z.enum(['asset', 'pair', 'market', 'macro']);

/**
 * Frequency types for time-series data
 */
export const FrequencySchema = z.enum(['tick', '1m', '5m', '1h', '1d']);

/**
 * Data source classes
 */
export const SourceClassSchema = z.enum(['onchain', 'cex', 'macro', 'derived']);

/**
 * Evidence reference for audit trail
 */
export const EvidenceRefSchema = z.object({
  source: z.string().min(1),
  url: z.string().url().optional(),
  hash: z.string().optional(),
  ts: z.string().datetime(),
});

/**
 * Data source specification
 */
export const DataSourceSpecSchema = z.object({
  id: z.string().min(1),
  class: SourceClassSchema,
  schema: z.string().min(1),
});

/**
 * Quality constraints for feature validation
 */
export const QualityConstraintsSchema = z.object({
  expected_range: z.tuple([z.number(), z.number()]).optional(),
  seasonal: z.boolean().optional(),
});

// ================================
// Feature Specification
// ================================

/**
 * Complete feature specification (catalog entry)
 *
 * @example
 * {
 *   "id": "macro/us/walcl_total_usd",
 *   "entity": "macro",
 *   "description": "Federal Reserve Total Assets",
 *   "unit": "USD",
 *   "frequency": "1d",
 *   "ttl_ms": 86400000,
 *   "tags": ["macro", "liquidity", "fed"],
 *   "source": { "id": "fred", "class": "macro", "schema": "v1" },
 *   "quality": { "expected_range": [6e12, 10e12] },
 *   "version": 1
 * }
 */
export const FeatureSpecSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9/_-]+$/,
      'Feature ID must be lowercase alphanumeric with / _ -'
    ),
  entity: EntitySchema,
  description: z.string().min(1),
  unit: z.string().min(1),
  frequency: FrequencySchema,
  ttl_ms: z.number().int().positive(),
  tags: z.array(z.string().min(1)),
  source: DataSourceSpecSchema,
  quality: QualityConstraintsSchema.optional(),
  version: z.number().int().positive(),
});

// ================================
// Feature Point (Time-Series)
// ================================

/**
 * Single time-series data point with metadata
 *
 * @example
 * {
 *   "featureId": "macro/us/walcl_total_usd",
 *   "ts": "2025-10-20T12:00:00Z",
 *   "value": 7.5e12,
 *   "stale": false,
 *   "confidence": 1.0,
 *   "meta": { "revision": "2025-10-18" },
 *   "evidence": [{ "source": "fred", "ts": "2025-10-20T12:00:00Z" }]
 * }
 */
export const FeaturePointSchema = z.object({
  featureId: z.string().min(1),
  ts: z.string().datetime(),
  value: z.number(),
  stale: z.boolean(),
  confidence: z.number().min(0).max(1),
  meta: z.record(z.any()).optional(),
  evidence: z.array(EvidenceRefSchema).optional(),
});

// ================================
// Query Schemas
// ================================

/**
 * Aggregation functions for time-series queries
 */
export const AggregationFunctionSchema = z.enum([
  'sum',
  'avg',
  'min',
  'max',
  'last',
  'first',
]);

/**
 * Query parameters for feature retrieval
 */
export const FeatureQuerySchema = z.object({
  featureIds: z.array(z.string().min(1)).min(1).max(50), // Max 50 features per query
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  agg: AggregationFunctionSchema.optional(),
  limit: z.number().int().positive().max(10000).optional(), // Max 10k points
});

/**
 * Query result for a single feature
 */
export const FeatureQueryResultSchema = z.object({
  featureId: z.string().min(1),
  points: z.array(FeaturePointSchema),
  total: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

// ================================
// Catalog Schemas
// ================================

/**
 * Catalog entry with activation status
 */
export const CatalogEntrySchema = FeatureSpecSchema.extend({
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Complete feature catalog
 */
export const FeatureCatalogSchema = z.array(CatalogEntrySchema);

// ================================
// Health & Status
// ================================

/**
 * Storage layer health
 */
export const StorageHealthSchema = z.object({
  pg: z.boolean(),
  redis: z.boolean().optional(),
  s3: z.boolean().optional(),
});

/**
 * Feature Store health status
 */
export const FeatureStoreHealthSchema = z.object({
  healthy: z.boolean(),
  storage: StorageHealthSchema,
  features_count: z.number().int().nonnegative(),
  last_ingest: z.string().datetime().optional(),
  uptime_seconds: z.number().nonnegative(),
});

// ================================
// Publish Schema (Oracle Only)
// ================================

/**
 * Batch publish request (oracle.publisher scope only)
 */
export const FeaturePublishRequestSchema = z.object({
  points: z.array(FeaturePointSchema).min(1).max(1000), // Max 1000 points per batch
  dry_run: z.boolean().optional(),
});

/**
 * Publish response
 */
export const FeaturePublishResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        featureId: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
});

// ================================
// Type Exports
// ================================

export type FeatureSpec = z.infer<typeof FeatureSpecSchema>;
export type FeaturePoint = z.infer<typeof FeaturePointSchema>;
export type FeatureQuery = z.infer<typeof FeatureQuerySchema>;
export type FeatureQueryResult = z.infer<typeof FeatureQueryResultSchema>;
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;
export type FeatureCatalog = z.infer<typeof FeatureCatalogSchema>;
export type FeatureStoreHealth = z.infer<typeof FeatureStoreHealthSchema>;
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export type DataSourceSpec = z.infer<typeof DataSourceSpecSchema>;
export type QualityConstraints = z.infer<typeof QualityConstraintsSchema>;
export type AggregationFunction = z.infer<typeof AggregationFunctionSchema>;
export type FeaturePublishRequest = z.infer<typeof FeaturePublishRequestSchema>;
export type FeaturePublishResponse = z.infer<
  typeof FeaturePublishResponseSchema
>;
