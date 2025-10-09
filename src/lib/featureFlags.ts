"use client";
// Minimal feature flag helper. In prod, wire to LaunchDarkly/Config.
// Reads NEXT_PUBLIC_* envs at build time when available.

const FLAGS: Record<string, boolean> = {
  FF_WSP_ENABLED: process.env.NEXT_PUBLIC_FF_WSP_ENABLED !== 'false',
  FF_SUMMER_ENABLED: process.env.NEXT_PUBLIC_FF_SUMMER_ENABLED === 'true',
};

export function useFeatureFlag(name: string): boolean {
  return Boolean(FLAGS[name]);
}
