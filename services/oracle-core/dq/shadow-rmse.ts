import { Gauge } from 'prom-client';

import { oracleMetricsRegistry } from '../metrics/oracle.metrics';
import type { Feed, Signal } from '../registry/schema';
import { estimateBaselineValue } from '../registry/feed-baseline';

interface ShadowStats {
  sumSquares: number;
  count: number;
  rmse: number;
  lastUpdated: string;
  baseline: number;
}

const stats = new Map<string, ShadowStats>();

export const dqShadowRmseGauge = new Gauge({
  name: 'oracle_dq_shadow_rmse',
  help: 'Shadow RMSE por feed frente a baseline estimado',
  labelNames: ['feed'],
  registers: [oracleMetricsRegistry],
});

export function resetShadowRmse() {
  stats.clear();
  dqShadowRmseGauge.reset();
}

export function updateShadowRmse(feed: Feed, signal: Signal, reference?: number) {
  const baseline = reference ?? estimateBaselineValue(feed);
  const error = signal.value - baseline;
  const squared = error * error;
  const entry = stats.get(feed.id) ?? {
    sumSquares: 0,
    count: 0,
    rmse: 0,
    lastUpdated: new Date(0).toISOString(),
    baseline,
  };

  entry.sumSquares += squared;
  entry.count += 1;
  entry.baseline = baseline;
  entry.rmse = Math.sqrt(entry.sumSquares / entry.count);
  entry.lastUpdated = signal.ts ?? new Date().toISOString();

  stats.set(feed.id, entry);
  dqShadowRmseGauge.set({ feed: feed.id }, entry.rmse);
}

export interface ShadowRmseSnapshot {
  feed: string;
  rmse: number;
  baseline: number;
  samples: number;
  lastUpdated: string;
}

export function getShadowRmseSnapshot(feedId?: string): ShadowRmseSnapshot[] {
  const entries = Array.from(stats.entries())
    .filter(([feed]) => (feedId ? feed === feedId : true))
    .map(([feed, data]) => ({
      feed,
      rmse: Number(data.rmse.toFixed(6)),
      baseline: data.baseline,
      samples: data.count,
      lastUpdated: data.lastUpdated,
    }));

  return entries.sort((a, b) => b.rmse - a.rmse);
}
