// Equities AI sleeve metrics instrumentation (Prometheus optional)
import type { EquitiesModelTelemetry } from '@/lib/equities/types';

export interface EquitiesMetricsSnapshot {
  apiHits: number;
  cacheHits: number;
  modelRuns: number;
  dryRunExecutions: number;
  recommendationPushes: number;
}

const metrics: EquitiesMetricsSnapshot = {
  apiHits: 0,
  cacheHits: 0,
  modelRuns: 0,
  dryRunExecutions: 0,
  recommendationPushes: 0,
};

let promEnabled = false;
let register: import('prom-client').Registry | undefined;
const counters: {
  apiHits?: import('prom-client').Counter<string>;
  cacheHits?: import('prom-client').Counter<string>;
  modelRuns?: import('prom-client').Counter<string>;
  dryRunExecutions?: import('prom-client').Counter<string>;
  recommendationPushes?: import('prom-client').Counter<string>;
} = {};
const histograms: {
  modelLatency?: import('prom-client').Histogram<string>;
} = {};

if (typeof window === 'undefined') {
  try {
    const prom = require('prom-client') as typeof import('prom-client');
    register = prom.register as import('prom-client').Registry;
    counters.apiHits = new prom.Counter({
      name: 'equities_ai_api_hits_total',
      help: 'Total API hits for Equities AI endpoints',
      labelNames: ['route', 'status'],
    });
    counters.cacheHits = new prom.Counter({
      name: 'equities_ai_cache_hits_total',
      help: 'Equities AI cache hits',
      labelNames: ['resource'],
    });
    counters.modelRuns = new prom.Counter({
      name: 'equities_ai_model_runs_total',
      help: 'Total model executions',
      labelNames: ['model', 'dryRun'],
    });
    counters.dryRunExecutions = new prom.Counter({
      name: 'equities_ai_dry_run_total',
      help: 'Dry-run model executions',
    });
    counters.recommendationPushes = new prom.Counter({
      name: 'equities_ai_recommendations_total',
      help: 'Recommendations packages generated',
      labelNames: ['dryRun'],
    });
    histograms.modelLatency = new prom.Histogram({
      name: 'equities_ai_model_latency_seconds',
      help: 'Model latency seconds',
      labelNames: ['model'],
      buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    });
    promEnabled = true;
  } catch {
    promEnabled = false;
  }
}

export function recordApiHit(route: string, status: number) {
  metrics.apiHits += 1;
  if (promEnabled && counters.apiHits) {
    counters.apiHits.inc({ route, status: String(status) });
  }
}

export function recordCacheHit(resource: string) {
  metrics.cacheHits += 1;
  if (promEnabled && counters.cacheHits) {
    counters.cacheHits.inc({ resource });
  }
}

export function recordModelTelemetry(telemetry: EquitiesModelTelemetry) {
  metrics.modelRuns += 1;
  if (telemetry.dryRun) {
    metrics.dryRunExecutions += 1;
  }

  if (promEnabled && counters.modelRuns) {
    counters.modelRuns.inc({ model: telemetry.model, dryRun: String(telemetry.dryRun) });
  }
  if (promEnabled && counters.dryRunExecutions && telemetry.dryRun) {
    counters.dryRunExecutions.inc();
  }
  if (promEnabled && histograms.modelLatency) {
    histograms.modelLatency.observe({ model: telemetry.model }, telemetry.latencyMs / 1000);
  }
}

export function recordRecommendation(dryRun: boolean) {
  metrics.recommendationPushes += 1;
  if (promEnabled && counters.recommendationPushes) {
    counters.recommendationPushes.inc({ dryRun: String(dryRun) });
  }
}

export async function getEquitiesPrometheusSnapshot(): Promise<string | null> {
  if (!promEnabled || !register) {
    return null;
  }
  return register.metrics();
}

export function getEquitiesMetrics(): EquitiesMetricsSnapshot {
  return { ...metrics };
}
