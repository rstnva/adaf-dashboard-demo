import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { guardrailManifestLoads } from '../metrics/oracle.metrics';

export interface GuardrailConfig {
  min?: number;
  max?: number;
  maxRelativeDelta?: number;
}

export interface GuardrailManifest {
  defaults?: GuardrailConfig;
  categories?: Record<string, GuardrailConfig>;
  feeds?: Record<string, GuardrailConfig>;
}

let cache: GuardrailManifest | null = null;
let memoizedPath: string | null = null;
let manifestChecksum: string | null = null;
let manifestLoadedAt: string | null = null;

function resolveManifestPath(): string {
  if (memoizedPath) {
    return memoizedPath;
  }

  try {
    const baseDir = dirname(fileURLToPath(import.meta.url));
    memoizedPath = resolve(baseDir, 'guardrails.json');
    return memoizedPath;
  } catch (error) {
    console.warn('oracle-guardrails: import.meta fallback engaged', error);
    memoizedPath = resolve(process.cwd(), 'services/oracle-core/dq/guardrails.json');
    return memoizedPath;
  }
}

interface LoadOptions {
  reload?: boolean;
}

async function loadManifest(options: LoadOptions = {}): Promise<GuardrailManifest> {
  if (options.reload) {
    cache = null;
  } else if (cache) {
    return cache;
  }

  try {
    const path = resolveManifestPath();
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw) as GuardrailManifest;
    cache = parsed;
    guardrailManifestLoads.inc({ mode: options.reload ? 'reload' : 'initial' });
    manifestChecksum = createHash('sha256').update(raw).digest('hex');
    manifestLoadedAt = new Date().toISOString();
    return parsed;
  } catch (error) {
    console.warn('oracle-guardrails: failed to load manifest', error);
    cache = {};
    manifestChecksum = null;
    manifestLoadedAt = null;
    return {};
  }
}

function mergeConfigs(...configs: Array<GuardrailConfig | undefined>): GuardrailConfig {
  const result: GuardrailConfig = {};
  for (const config of configs) {
    if (!config) continue;
    if (typeof config.min === 'number') result.min = config.min;
    if (typeof config.max === 'number') result.max = config.max;
    if (typeof config.maxRelativeDelta === 'number') result.maxRelativeDelta = config.maxRelativeDelta;
  }
  return result;
}

export async function getGuardrails(feedId: string, category?: string): Promise<GuardrailConfig | null> {
  const manifest = await loadManifest();
  const defaults = manifest.defaults;
  const categoryConfig = category ? manifest.categories?.[category] : undefined;
  const feedConfig = manifest.feeds?.[feedId];

  const merged = mergeConfigs(defaults, categoryConfig, feedConfig);
  if (Object.keys(merged).length === 0) {
    return null;
  }
  return merged;
}

export function invalidateGuardrailsCache() {
  cache = null;
  memoizedPath = null;
  manifestChecksum = null;
  manifestLoadedAt = null;
}

export async function getGuardrailManifest(options: { reload?: boolean } = {}): Promise<GuardrailManifest> {
  return loadManifest({ reload: options.reload });
}

export function getGuardrailManifestMetadata() {
  return {
    checksum: manifestChecksum,
    lastLoadedAt: manifestLoadedAt,
    path: memoizedPath,
  };
}
