import type { Signal } from '../../registry/schema';

/**
 * Bot mitigation heuristics and credibility decay for Vox Populi ingestion.
 */
export interface BotScore {
  authorId: string;
  credibility: number;
}

export interface SourceBurst {
  source_id: string;
  timestamp: number;
  volume: number;
}

/**
 * Compute burst overlap index (0..1) between multiple sources.
 * High overlap + low time variance = coordinated brigading signal.
 */
export function computeBurstOverlapIndex(bursts: SourceBurst[]): number {
  if (bursts.length < 2) return 0;
  
  // Calculate time variance
  const times = bursts.map(b => b.timestamp);
  const meanTime = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.map(t => (t - meanTime) ** 2).reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize: low stdDev (coordinated) = high overlap
  const maxExpectedStdDev = 3600000; // 1 hour in ms
  const overlapIndex = Math.max(0, 1 - stdDev / maxExpectedStdDev);
  
  return overlapIndex;
}

/**
 * Compute credibility score with exponential decay.
 * @param baseScore - Initial credibility (0..1)
 * @param accountAgeDays - Account age
 * @param lastActivityHours - Hours since last activity
 * @param decayRate - Decay factor (default 0.1 = 10% per day)
 */
export function computeCredWithDecay(
  baseScore: number,
  accountAgeDays: number,
  lastActivityHours: number,
  decayRate: number = 0.1
): number {
  // Boost for older accounts
  const ageBoost = Math.min(accountAgeDays / 365, 1) * 0.2;
  
  // Decay for inactivity
  const daysSinceActivity = lastActivityHours / 24;
  const decay = Math.exp(-decayRate * daysSinceActivity);
  
  return Math.max(0, Math.min(1, (baseScore + ageBoost) * decay));
}

/**
 * Detect language/timezone heuristics for bot detection.
 * Returns suspicion score (0..1), higher = more suspicious.
 */
export function detectLanguageTimezoneAnomaly(
  lang: string,
  timezone: string,
  expectedLang: string,
  expectedTimezone: string
): number {
  let suspicion = 0;
  
  // Language mismatch
  if (lang !== expectedLang) {
    suspicion += 0.3;
  }
  
  // Timezone mismatch
  if (timezone !== expectedTimezone) {
    suspicion += 0.3;
  }
  
  // Both mismatch = highly suspicious
  if (lang !== expectedLang && timezone !== expectedTimezone) {
    suspicion += 0.2;
  }
  
  return Math.min(1, suspicion);
}

/**
 * Final brigading score aggregator.
 */
export function computeFinalBrigadingScore(
  overlapIndex: number,
  avgCredibility: number,
  suspicionScore: number
): number {
  // Weight factors: overlap 40%, low cred 40%, suspicion 20%
  return Math.round(100 * (0.4 * overlapIndex + 0.4 * (1 - avgCredibility) + 0.2 * suspicionScore));
}

export function assessCredibility(_authorId: string): BotScore {
  // TODO: implement heuristics (account age, follower ratio, posting cadence, repetition).
  return {
    authorId: _authorId,
    credibility: 0.5,
  };
}

export function applyBotGuards(signals: Signal[]): Signal[] {
  // TODO: drop or down-weight signals that fall below credibility thresholds.
  return signals;
}
