import type { Signal } from '../registry/schema';

export interface QualityCheckResult {
  stale: boolean;
  confidence: number;
}

export function applyQualityGuards(signal: Signal, ttlMs: number): QualityCheckResult {
  const ageMs = Date.now() - new Date(signal.ts).getTime();
  const stale = ageMs > ttlMs;
  const confidence = stale ? Math.min(signal.confidence, 0.4) : signal.confidence;
  return { stale, confidence };
}
