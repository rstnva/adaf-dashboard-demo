import { z } from 'zod';

export const EvidenceRefSchema = z.object({
  source_id: z.string(),
  url: z.string().url().optional(),
  hash: z.string().optional(),
  captured_at: z.string().datetime(),
});

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const FeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  ttl_ms: z.number().int().positive(),
  quorum: z.object({
    k: z.number().int().positive(),
    n: z.number().int().positive(),
  }),
  sources: z
    .array(
      z.object({
        id: z.string(),
        weight: z.number().positive(),
        ttl_ms: z.number().int().positive().optional(),
      })
    )
    .min(1),
  tags: z.array(z.string()).default([]),
  version: z.number().int().nonnegative(),
});

export type Feed = z.infer<typeof FeedSchema>;

export const SignalSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  ts: z.string().datetime(),
  value: z.number(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  quorum_ok: z.boolean(),
  stale: z.boolean(),
  evidence: z.array(EvidenceRefSchema).default([]),
  tags: z.array(z.string()).default([]),
  rev: z.number().int().nonnegative(),
});

export type Signal = z.infer<typeof SignalSchema>;

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  inputFeeds: z.array(z.string()),
  outputFeeds: z.array(z.string()),
  version: z.string(),
  owner: z.string(),
  cards: z.object({
    description: z.string(),
    limitations: z.string(),
  }),
});

export type Model = z.infer<typeof ModelSchema>;

export const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  schema_version: z.string(),
  storage: z.object({
    s3_uri: z.string().url().optional(),
    table: z.string().optional(),
  }),
  retention_days: z.number().int().nonnegative(),
});

export type Dataset = z.infer<typeof DatasetSchema>;

export const OracleRegistrySchema = z.object({
  feeds: z.array(FeedSchema),
  models: z.array(ModelSchema),
  datasets: z.array(DatasetSchema),
});

export type OracleRegistry = z.infer<typeof OracleRegistrySchema>;

export const validateFeed = (payload: unknown): Feed => FeedSchema.parse(payload);
export const validateSignal = (payload: unknown): Signal => SignalSchema.parse(payload);
export const validateRegistry = (payload: unknown): OracleRegistry =>
  OracleRegistrySchema.parse(payload);
