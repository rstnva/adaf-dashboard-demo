/**
 * Feature Store - Time-Warp Replay
 *
 * Replays historical data as-if it were real-time for:
 * - Backtesting trading strategies
 * - Testing alert systems
 * - Debugging time-dependent logic
 * - Training ML models
 *
 * Fortune 500 Standards:
 * - Deterministic replay (reproducible results)
 * - Configurable playback speed
 * - Event hooks for time-sensitive operations
 * - Audit trail of replayed data
 *
 * @module services/feature-store/ingest/replay
 */

import { FeaturePoint } from '../schema/zod';
import { queryFeaturePoints } from '../storage/pg';

/**
 * Replay options
 */
export interface ReplayOptions {
  featureIds: string[];
  startTime: string; // ISO 8601 - Replay start
  endTime: string; // ISO 8601 - Replay end
  speed?: number; // Playback speed multiplier (1.0 = real-time, 10.0 = 10x faster)
  onPoint?: (_point: FeaturePoint) => void | Promise<void>; // Callback for each point
  onComplete?: () => void | Promise<void>; // Callback on completion
}

/**
 * Replay state
 */
export interface ReplayState {
  id: string;
  featureIds: string[];
  startTime: string;
  endTime: string;
  currentTime: string;
  speed: number;
  status: 'running' | 'paused' | 'completed' | 'stopped';
  pointsReplayed: number;
  progress: number; // 0.0 to 1.0
}

/**
 * Active replays
 */
const activeReplays = new Map<string, ReplayState>();

/**
 * Replay historical data as real-time stream
 *
 * MOCK IMPLEMENTATION - In production, this would:
 * 1. Query historical data from storage
 * 2. Sort by timestamp
 * 3. Stream data at specified speed
 * 4. Trigger callbacks for each point
 * 5. Handle pause/resume/stop
 * 6. Emit metrics
 *
 * @param options - Replay options
 * @returns Replay ID for tracking
 */
export async function startReplay(options: ReplayOptions): Promise<string> {
  const {
    featureIds,
    startTime,
    endTime,
    speed = 1.0,
    onPoint,
    onComplete,
  } = options;

  // Generate unique replay ID
  const replayId = `replay-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Initialize state
  const state: ReplayState = {
    id: replayId,
    featureIds,
    startTime,
    endTime,
    currentTime: startTime,
    speed,
    status: 'running',
    pointsReplayed: 0,
    progress: 0,
  };

  activeReplays.set(replayId, state);

  // Start replay in background
  replayInBackground(replayId, options).catch(error => {
    console.error(`[FeatureStore:Replay] Replay ${replayId} failed:`, error);
    state.status = 'stopped';
  });

  return replayId;
}

/**
 * Background replay execution
 */
async function replayInBackground(
  replayId: string,
  options: ReplayOptions
): Promise<void> {
  const { featureIds, startTime, endTime, speed = 1.0 } = options;
  const state = activeReplays.get(replayId);

  if (!state) return;

  try {
    // Query all historical data
    const points = await queryFeaturePoints({
      featureIds,
      since: startTime,
      until: endTime,
      orderBy: 'asc',
    });

    console.log(
      `[FeatureStore:Replay] ${replayId}: Replaying ${points.length} points`
    );

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const totalDuration = end - start;

    // Replay each point
    for (let i = 0; i < points.length; i++) {
      // Check if paused or stopped
      const currentState = activeReplays.get(replayId);
      if (!currentState || currentState.status === 'stopped') {
        console.log(`[FeatureStore:Replay] ${replayId}: Stopped`);
        return;
      }

      while (currentState.status === 'paused') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const point = points[i];

      // Calculate delay based on timestamp and speed
      if (i > 0) {
        const prevTs = new Date(points[i - 1].ts).getTime();
        const currentTs = new Date(point.ts).getTime();
        const realDelay = currentTs - prevTs;
        const scaledDelay = realDelay / speed;

        if (scaledDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, scaledDelay));
        }
      }

      // Update state
      state.currentTime = point.ts;
      state.pointsReplayed = i + 1;
      state.progress = (new Date(point.ts).getTime() - start) / totalDuration;

      // Trigger callback
      if (options.onPoint) {
        await options.onPoint(point);
      }
    }

    // Complete
    state.status = 'completed';
    state.progress = 1.0;

    if (options.onComplete) {
      await options.onComplete();
    }

    console.log(
      `[FeatureStore:Replay] ${replayId}: Completed (${state.pointsReplayed} points)`
    );
  } catch (error) {
    console.error(`[FeatureStore:Replay] ${replayId}: Error:`, error);
    state.status = 'stopped';
    throw error;
  }
}

/**
 * Pause replay
 *
 * @param replayId - Replay ID
 */
export function pauseReplay(replayId: string): void {
  const state = activeReplays.get(replayId);
  if (state && state.status === 'running') {
    state.status = 'paused';
    console.log(`[FeatureStore:Replay] ${replayId}: Paused`);
  }
}

/**
 * Resume replay
 *
 * @param replayId - Replay ID
 */
export function resumeReplay(replayId: string): void {
  const state = activeReplays.get(replayId);
  if (state && state.status === 'paused') {
    state.status = 'running';
    console.log(`[FeatureStore:Replay] ${replayId}: Resumed`);
  }
}

/**
 * Stop replay
 *
 * @param replayId - Replay ID
 */
export function stopReplay(replayId: string): void {
  const state = activeReplays.get(replayId);
  if (state) {
    state.status = 'stopped';
    console.log(`[FeatureStore:Replay] ${replayId}: Stopped`);
  }
}

/**
 * Get replay state
 *
 * @param replayId - Replay ID
 * @returns Replay state or null
 */
export function getReplayState(replayId: string): ReplayState | null {
  return activeReplays.get(replayId) || null;
}

/**
 * Get all active replays
 *
 * @returns Array of replay states
 */
export function getAllReplays(): ReplayState[] {
  return Array.from(activeReplays.values());
}

/**
 * Clear completed replays
 */
export function clearCompletedReplays(): void {
  for (const [replayId, state] of activeReplays.entries()) {
    if (state.status === 'completed' || state.status === 'stopped') {
      activeReplays.delete(replayId);
    }
  }
}
