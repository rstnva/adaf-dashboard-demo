import { rpcHeartbeatLatencyScore, rpcHeartbeatAgeSeconds } from '../metrics/oracle.metrics';

interface RpcBaseline {
  feed: string;
  rpc: string;
  sloLatencyMs: number;
  maxAgeSeconds: number;
  network: string;
}

export type RpcStatus = 'healthy' | 'degraded' | 'critical';

export interface RpcHeartbeatRow {
  feed: string;
  rpc: string;
  network: string;
  latencyMs: number;
  latencyScore: number;
  status: RpcStatus;
  lastHeartbeat: string;
  maxAgeSeconds: number;
  errored: number;
}

const HEARTBEAT_BASELINE: RpcBaseline[] = [
  { feed: 'wsp/etf/btc_inflow_usd', rpc: 'mock-btc-l2', sloLatencyMs: 200, maxAgeSeconds: 45, network: 'L2-MOCK' },
  { feed: 'wsp/rates/dxy_index', rpc: 'mock-fx-core', sloLatencyMs: 250, maxAgeSeconds: 60, network: 'FX-MOCK' },
  { feed: 'news/impact/hack_score', rpc: 'mock-news-bus', sloLatencyMs: 400, maxAgeSeconds: 90, network: 'Kafka-MOCK' },
  { feed: 'blackbox/onchain/token:eth/exch_balance_usd', rpc: 'mock-eth-archive', sloLatencyMs: 320, maxAgeSeconds: 75, network: 'Ethereum' },
  { feed: 'oracles/latency/chainlink_eth', rpc: 'mock-chainlink', sloLatencyMs: 180, maxAgeSeconds: 40, network: 'Ethereum' },
  { feed: 'stables/peg/usdc_premium_bps', rpc: 'mock-stables', sloLatencyMs: 220, maxAgeSeconds: 50, network: 'Cross-chain' },
  { feed: 'vol/surface/btc_iv_30d_atm', rpc: 'mock-deribit', sloLatencyMs: 260, maxAgeSeconds: 55, network: 'Derivatives' },
  { feed: 'blockspace/protected_flow_ratio', rpc: 'mock-mev', sloLatencyMs: 210, maxAgeSeconds: 40, network: 'MEV' },
  { feed: 'gov/proposals/dao_a_active_count', rpc: 'mock-governance', sloLatencyMs: 500, maxAgeSeconds: 120, network: 'Governance' },
  { feed: 'alpha/signal/liquidity_rotation', rpc: 'mock-alpha', sloLatencyMs: 280, maxAgeSeconds: 60, network: 'Research' },
];

const heartbeats = new Map<string, RpcHeartbeatRow>();

function keyOf(feed: string, rpc: string) {
  return `${feed}::${rpc}`;
}

function computeStatus(latencyMs: number, baseline: RpcBaseline, lastHeartbeat: string, errors: number): RpcStatus {
  const ageSeconds = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000;
  if (errors >= 3 || ageSeconds > baseline.maxAgeSeconds * 2) {
    return 'critical';
  }
  if (latencyMs > baseline.sloLatencyMs * 1.5 || ageSeconds > baseline.maxAgeSeconds) {
    return 'degraded';
  }
  return 'healthy';
}

export function resolveBaseline(feed: string): RpcBaseline | undefined {
  return HEARTBEAT_BASELINE.find(entry => entry.feed === feed);
}

export function updateRpcHeartbeat(feed: string, rpc: string, latencyMs: number, errored = false) {
  const baseline = resolveBaseline(feed) ?? {
    feed,
    rpc,
    sloLatencyMs: 300,
    maxAgeSeconds: 60,
    network: 'mock',
  };

  const now = new Date();
  const latencyScoreRaw = Math.max(0, 1 - latencyMs / Math.max(baseline.sloLatencyMs, 1));
  const latencyScore = Number(latencyScoreRaw.toFixed(4));
  const key = keyOf(feed, rpc);
  const existing = heartbeats.get(key);

  const erroredCount = Math.max(0, (existing?.errored ?? 0) + (errored ? 1 : 0));
  const row: RpcHeartbeatRow = {
    feed,
    rpc,
    network: baseline.network,
    latencyMs,
    latencyScore,
    lastHeartbeat: now.toISOString(),
    maxAgeSeconds: baseline.maxAgeSeconds,
    status: computeStatus(latencyMs, baseline, now.toISOString(), erroredCount),
    errored: erroredCount,
  };

  heartbeats.set(key, row);

  rpcHeartbeatLatencyScore.set({ feed, rpc }, latencyScore);
  rpcHeartbeatAgeSeconds.set({ feed, rpc }, 0);
}

export function ageHeartbeats() {
  const now = Date.now();
  for (const [key, row] of heartbeats.entries()) {
    const ageSeconds = (now - new Date(row.lastHeartbeat).getTime()) / 1000;
    rpcHeartbeatAgeSeconds.set({ feed: row.feed, rpc: row.rpc }, ageSeconds);
    const baseline = resolveBaseline(row.feed) ?? {
      feed: row.feed,
      rpc: row.rpc,
      sloLatencyMs: 300,
      maxAgeSeconds: 60,
      network: 'mock',
    };
    const status = computeStatus(row.latencyMs, baseline, row.lastHeartbeat, row.errored);
    if (status !== row.status) {
      heartbeats.set(key, { ...row, status });
    }
  }
}

export function recordRpcError(feed: string, rpc: string) {
  const key = keyOf(feed, rpc);
  const existing = heartbeats.get(key);
  if (!existing) {
    updateRpcHeartbeat(feed, rpc, baselineLatency(feed));
    return;
  }
  heartbeats.set(key, {
    ...existing,
    errored: existing.errored + 1,
    status: 'critical',
  });
}

function baselineLatency(feed: string) {
  return resolveBaseline(feed)?.sloLatencyMs ?? 300;
}

export function getRpcHeartbeatTable(): RpcHeartbeatRow[] {
  ageHeartbeats();
  return Array.from(heartbeats.values()).sort((a, b) => a.feed.localeCompare(b.feed));
}

export function seedHeartbeatTable() {
  const now = Date.now();
  HEARTBEAT_BASELINE.forEach(entry => {
    const jitter = (Math.random() - 0.5) * 0.3;
    const latency = Math.max(1, entry.sloLatencyMs * (1 + jitter));
    const timestamp = new Date(now - Math.random() * entry.maxAgeSeconds * 500).toISOString();
    const row: RpcHeartbeatRow = {
      feed: entry.feed,
      rpc: entry.rpc,
      network: entry.network,
      latencyMs: Number(latency.toFixed(2)),
      latencyScore: Number(Math.max(0, 1 - latency / entry.sloLatencyMs).toFixed(4)),
      status: 'healthy',
      lastHeartbeat: timestamp,
      maxAgeSeconds: entry.maxAgeSeconds,
      errored: 0,
    };
    heartbeats.set(keyOf(entry.feed, entry.rpc), row);
    rpcHeartbeatLatencyScore.set({ feed: entry.feed, rpc: entry.rpc }, row.latencyScore);
    const ageSeconds = (Date.now() - new Date(timestamp).getTime()) / 1000;
    rpcHeartbeatAgeSeconds.set({ feed: entry.feed, rpc: entry.rpc }, ageSeconds);
  });
}

seedHeartbeatTable();
