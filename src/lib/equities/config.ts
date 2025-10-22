const DEFAULT_CACHE_TTL_MS = 60_000;

const enabledFlag = process.env.NEXT_PUBLIC_FF_EQUITIES_AI_ENABLED;
const dryRunFlag = process.env.NEXT_PUBLIC_FF_EQUITIES_AI_DRY_RUN;

export function isEquitiesAiFeatureEnabled(): boolean {
  if (enabledFlag === undefined) {
    return false;
  }
  return enabledFlag === 'true';
}

export function isEquitiesDryRun(): boolean {
  if (!isEquitiesAiFeatureEnabled()) {
    return true;
  }
  if (dryRunFlag === undefined) {
    return true;
  }
  return dryRunFlag !== 'false';
}

export interface EquitiesRuntimeConfig {
  featureEnabled: boolean;
  dryRun: boolean;
  cacheTtlMs: number;
}

export function getEquitiesRuntimeConfig(): EquitiesRuntimeConfig {
  return {
    featureEnabled: isEquitiesAiFeatureEnabled(),
    dryRun: isEquitiesDryRun(),
    cacheTtlMs: Number(process.env.EQUITIES_AI_CACHE_TTL_MS ?? DEFAULT_CACHE_TTL_MS),
  };
}
