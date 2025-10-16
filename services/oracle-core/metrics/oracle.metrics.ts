import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const oracleMetricsRegistry = new Registry();

export const ingestTotal = new Counter({
  name: 'oracle_ingest_total',
  help: 'Total number of ingested signals',
  labelNames: ['source'],
  registers: [oracleMetricsRegistry],
});

export const ingestFailTotal = new Counter({
  name: 'oracle_ingest_fail_total',
  help: 'Total number of failed ingestions',
  labelNames: ['source'],
  registers: [oracleMetricsRegistry],
});

export const digestLatency = new Histogram({
  name: 'oracle_digest_latency_seconds',
  help: 'Latency histogram for digest stage',
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [oracleMetricsRegistry],
});

export const consensusLatency = new Histogram({
  name: 'oracle_consensus_latency_seconds',
  help: 'Latency histogram for consensus stage',
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [oracleMetricsRegistry],
});

export const signalsTotal = new Counter({
  name: 'oracle_signals_total',
  help: 'Signals generated per feed',
  labelNames: ['feed'],
  registers: [oracleMetricsRegistry],
});

export const staleRatio = new Gauge({
  name: 'oracle_stale_ratio',
  help: 'Stale ratio by feed',
  labelNames: ['feed'],
  registers: [oracleMetricsRegistry],
});

export const quorumFailTotal = new Counter({
  name: 'oracle_quorum_fail_total',
  help: 'Total quorum failures by feed',
  labelNames: ['feed'],
  registers: [oracleMetricsRegistry],
});

export const dqFailureTotal = new Counter({
  name: 'oracle_dq_fail_total',
  help: 'Total number of data quality failures',
  labelNames: ['feed', 'rule'],
  registers: [oracleMetricsRegistry],
});

export const dqEvaluationsTotal = new Counter({
  name: 'oracle_dq_evaluations_total',
  help: 'Total number of data quality rule evaluations by outcome',
  labelNames: ['feed', 'rule', 'outcome'],
  registers: [oracleMetricsRegistry],
});

export const readsTotal = new Counter({
  name: 'oracle_reads_total',
  help: 'Oracle reads by feed and widget',
  labelNames: ['feed', 'widget'],
  registers: [oracleMetricsRegistry],
});

export const readLatency = new Histogram({
  name: 'oracle_read_latency_seconds',
  help: 'Read latency distribution',
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [oracleMetricsRegistry],
});

export const subscribersGauge = new Gauge({
  name: 'oracle_subscribers_gauge',
  help: 'Active websocket subscribers per feed',
  labelNames: ['feed'],
  registers: [oracleMetricsRegistry],
});

export const guardrailManifestLoads = new Counter({
  name: 'oracle_guardrail_manifest_load_total',
  help: 'Total guardrail manifest loads grouped by mode',
  labelNames: ['mode'],
  registers: [oracleMetricsRegistry],
});

export const rpcHeartbeatLatencyScore = new Gauge({
  name: 'oracle_rpc_latency_score',
  help: 'Latency score (0-1) per feed RPC heartbeat',
  labelNames: ['feed', 'rpc'],
  registers: [oracleMetricsRegistry],
});

export const rpcHeartbeatAgeSeconds = new Gauge({
  name: 'oracle_rpc_heartbeat_age_seconds',
  help: 'Age in seconds since last RPC heartbeat was recorded',
  labelNames: ['feed', 'rpc'],
  registers: [oracleMetricsRegistry],
});
