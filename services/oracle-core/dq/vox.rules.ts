// DQ specific rules for Vox Populi
import { Signal } from '../registry/schema';

export interface VoxDQRule {
  feedId: string;
  type: 'CUSUM' | 'COOLDOWN' | 'DIURNALITY' | 'OUTLIER';
  threshold: number;
  window: number; // minutes
  enabled: boolean;
}

export interface QuarantineEvent {
  feedId: string;
  reason: string;
  timestamp: string;
  duration_ms: number;
  cause: string; // VOX_BRIGADING, VOX_OUTLIER, VOX_COOLDOWN
}

const quarantineStore: Map<string, QuarantineEvent> = new Map();

/**
 * CUSUM control chart for Vox signals.
 * Detects sustained shifts in mean.
 */
export function applyCUSUM(values: number[], threshold: number = 5): boolean {
  if (values.length < 2) return false;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  let cumsum = 0;
  
  for (const v of values) {
    cumsum += v - mean;
    if (Math.abs(cumsum) > threshold) {
      return true; // Detected shift
    }
  }
  
  return false;
}

/**
 * Check if feed is in cooldown after brigading detection.
 */
export function isInCooldown(feedId: string, cooldownMinutes: number = 15): boolean {
  const event = quarantineStore.get(feedId);
  if (!event) return false;
  
  const elapsed = Date.now() - new Date(event.timestamp).getTime();
  return elapsed < cooldownMinutes * 60 * 1000;
}

/**
 * Normalize by diurnality (hour of day pattern).
 * Simple version: penalize off-hours activity bursts.
 */
export function normalizeDiurnality(volume: number, hour: number): number {
  // Peak hours 9-17, off-hours 0-6 and 22-24
  const isPeakHour = hour >= 9 && hour <= 17;
  return isPeakHour ? volume : volume * 0.7; // Reduce off-hours weight
}

/**
 * Quarantine a feed with cause and duration.
 */
export function quarantineFeed(feedId: string, cause: string, durationMs: number = 900000) {
  const event: QuarantineEvent = {
    feedId,
    reason: `DQ violation: ${cause}`,
    timestamp: new Date().toISOString(),
    duration_ms: durationMs,
    cause,
  };
  quarantineStore.set(feedId, event);
  console.log(`[QUARANTINE] ${feedId} - ${cause} for ${durationMs / 60000}min`);
}

/**
 * Check if feed should be quarantined based on Vox-specific rules.
 */
export function checkVoxQuarantine(signal: Signal, history: number[]): boolean {
  const feedId = signal.feedId;
  
  // Check CUSUM
  if (applyCUSUM(history, 5)) {
    quarantineFeed(feedId, 'VOX_OUTLIER', 900000);
    return true;
  }
  
  // Check brigading score
  if (signal.tags?.includes('brigading')) {
    quarantineFeed(feedId, 'VOX_BRIGADING', 1800000); // 30min
    return true;
  }
  
  // Check cooldown
  if (isInCooldown(feedId, 15)) {
    return true;
  }
  
  return false;
}

/**
 * Get all quarantine events for reporting.
 */
export function getQuarantineEvents(): QuarantineEvent[] {
  return Array.from(quarantineStore.values());
}

/**
 * Clear expired quarantine events.
 */
export function clearExpiredQuarantines() {
  const now = Date.now();
  for (const [feedId, event] of quarantineStore.entries()) {
    const elapsed = now - new Date(event.timestamp).getTime();
    if (elapsed > event.duration_ms) {
      quarantineStore.delete(feedId);
      console.log(`[QUARANTINE CLEARED] ${feedId}`);
    }
  }
}
