import { Registry, Counter, Gauge } from 'prom-client';

const registry = new Registry();

export const voxIngestTotal = new Counter({
  name: 'vox_ingest_total',
  help: 'Total Vox Populi records ingested by source',
  labelNames: ['source'] as const,
  registers: [registry],
});

export const voxIngestFailTotal = new Counter({
  name: 'vox_ingest_fail_total',
  help: 'Failed Vox Populi ingestions by source',
  labelNames: ['source'] as const,
  registers: [registry],
});

export const voxValenceAvg = new Gauge({
  name: 'vox_valence_avg',
  help: 'Weighted average valence per asset',
  labelNames: ['asset'] as const,
  registers: [registry],
});

export const voxVolumePerMin = new Gauge({
  name: 'vox_volume_per_min',
  help: 'Mentions per minute per asset',
  labelNames: ['asset'] as const,
  registers: [registry],
});

export const voxVelocityZ = new Gauge({
  name: 'vox_velocity_z',
  help: 'Velocity z-score per asset',
  labelNames: ['asset'] as const,
  registers: [registry],
});

export const voxVpi = new Gauge({
  name: 'vox_vpi',
  help: 'Vox Populi Index per asset',
  labelNames: ['asset'] as const,
  registers: [registry],
});

export const voxBrigadingSuspectedTotal = new Counter({
  name: 'vox_brigading_suspected_total',
  help: 'Total suspected brigading events detected',
  labelNames: ['asset', 'source'] as const,
  registers: [registry],
});

export function getVoxRegistry() {
  return registry;
}
