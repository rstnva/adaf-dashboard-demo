"use client";
// Minimal feature flag helper. In prod, wire to LaunchDarkly/Config.
// Reads NEXT_PUBLIC_* envs at build time when available.

export const FEATURE_FLAG_KEYS = {
  FF_WSP_ENABLED: 'FF_WSP_ENABLED',
  FF_SUMMER_ENABLED: 'FF_SUMMER_ENABLED',
  FF_BLOCKSPACE_SIM: 'FF_BLOCKSPACE_SIM',
  FF_VAULTS_LAV_SIM: 'FF_VAULTS_LAV_SIM',
  FF_ALPHA_FACTORY_SIM: 'FF_ALPHA_FACTORY_SIM',
  FF_VOL_PRO_SIM: 'FF_VOL_PRO_SIM',
  FF_EVENT_ALPHA_SIM: 'FF_EVENT_ALPHA_SIM',
  FF_MM_SELECTIVE_SIM: 'FF_MM_SELECTIVE_SIM',
  FF_TCA_SIM: 'FF_TCA_SIM',
  FF_COSMOS_EXECUTOR_SIM: 'FF_COSMOS_EXECUTOR_SIM',
  FF_LIQUIDITY_BACKSTOP_SIM: 'FF_LIQUIDITY_BACKSTOP_SIM',
  FF_EQUITIES_AI_ENABLED: 'FF_EQUITIES_AI_ENABLED',
  FF_EQUITIES_AI_DRY_RUN: 'FF_EQUITIES_AI_DRY_RUN',
  FF_NEWS_ORACLE_ENABLED: 'FF_NEWS_ORACLE_ENABLED',
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAG_KEYS;

const FLAGS: Record<FeatureFlagName, boolean> = {
  FF_WSP_ENABLED: process.env.NEXT_PUBLIC_FF_WSP_ENABLED !== 'false',
  FF_SUMMER_ENABLED: process.env.NEXT_PUBLIC_FF_SUMMER_ENABLED === 'true',
  FF_BLOCKSPACE_SIM: process.env.NEXT_PUBLIC_FF_BLOCKSPACE_SIM === 'true',
  FF_VAULTS_LAV_SIM: process.env.NEXT_PUBLIC_FF_VAULTS_LAV_SIM === 'true',
  FF_ALPHA_FACTORY_SIM: process.env.NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM === 'true',
  FF_VOL_PRO_SIM: process.env.NEXT_PUBLIC_FF_VOL_PRO_SIM === 'true',
  FF_EVENT_ALPHA_SIM: process.env.NEXT_PUBLIC_FF_EVENT_ALPHA_SIM === 'true',
  FF_MM_SELECTIVE_SIM: process.env.NEXT_PUBLIC_FF_MM_SELECTIVE_SIM === 'true',
  FF_TCA_SIM: process.env.NEXT_PUBLIC_FF_TCA_SIM === 'true',
  FF_COSMOS_EXECUTOR_SIM: process.env.NEXT_PUBLIC_FF_COSMOS_EXECUTOR_SIM === 'true',
  FF_LIQUIDITY_BACKSTOP_SIM:
    process.env.NEXT_PUBLIC_FF_LIQUIDITY_BACKSTOP_SIM === 'true',
  FF_EQUITIES_AI_ENABLED:
    process.env.NEXT_PUBLIC_FF_EQUITIES_AI_ENABLED === 'true',
  FF_EQUITIES_AI_DRY_RUN:
    process.env.NEXT_PUBLIC_FF_EQUITIES_AI_DRY_RUN !== 'false',
  FF_NEWS_ORACLE_ENABLED:
    process.env.NEXT_PUBLIC_FF_NEWS_ORACLE_ENABLED === 'true',
};

export function useFeatureFlag(name: FeatureFlagName): boolean {
  return Boolean(FLAGS[name]);
}

export function getFeatureFlags() {
  return { ...FLAGS };
}
