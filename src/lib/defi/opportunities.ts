import { cache } from "react";

import { DefiOpportunity, DefiOpportunitiesResponse, RawDefiLlamaPool } from "./types";

const DEFI_LLAMA_ENDPOINT = "https://yields.llama.fi/pools";
const REVALIDATE_SECONDS = 60;

const CATEGORY_MATCHERS: Record<string, DefiOpportunity["category"]> = {
  lending: "lending",
  stable: "lending",
  "money market": "lending",
  restake: "lsd-restaking",
  eigenlayer: "lsd-restaking",
  lsd: "lsd",
  staking: "lsd",
  gearbox: "structured",
  summer: "structured",
  structured: "structured",
  perp: "perps",
  perpetual: "perps",
  swap: "dex",
  dex: "dex",
  curve: "dex",
  aggregat: "aggregator",
  points: "points",
};

const HIGH_PRIORITY_PROTOCOLS = new Set([
  "gearbox",
  "aave",
  "summerfi",
  "eigenlayer",
  "lybra",
  "pendle",
  "frax",
  "maker",
  "lido",
  "maple",
]);

export interface FetchDefiOpportunitiesParams {
  chains?: string[];
  protocols?: string[];
  minApy?: number;
  maxResults?: number;
  stablecoinOnly?: boolean;
}

const normalize = (value: string | null | undefined) =>
  value?.toLowerCase().trim() ?? "";

function detectCategory(project: string, pool: RawDefiLlamaPool): DefiOpportunity["category"] {
  const key = normalize(pool.poolMeta) || normalize(pool.exposure) || normalize(project);

  for (const matcher of Object.keys(CATEGORY_MATCHERS)) {
    if (key.includes(matcher)) {
      return CATEGORY_MATCHERS[matcher];
    }
  }

  return "other";
}

function detectRisk(pool: RawDefiLlamaPool): DefiOpportunity["riskLevel"] {
  const audit = pool.auditScore ?? null;
  const ilRisk = normalize(pool.ilRisk);

  if (audit !== null) {
    if (audit >= 80) return "low";
    if (audit >= 60) return "medium";
    return "high";
  }

  if (ilRisk.includes("low")) return "low";
  if (ilRisk.includes("medium")) return "medium";
  if (ilRisk.includes("high")) return "high";

  if (pool.stablecoin) return "low";
  return "unknown";
}

const sortOpportunities = (a: DefiOpportunity, b: DefiOpportunity) => {
  const priorityA = HIGH_PRIORITY_PROTOCOLS.has(normalize(a.protocol)) ? 1 : 0;
  const priorityB = HIGH_PRIORITY_PROTOCOLS.has(normalize(b.protocol)) ? 1 : 0;

  if (priorityA !== priorityB) {
    return priorityB - priorityA;
  }

  if (Number.isFinite(b.apy) && Number.isFinite(a.apy)) {
    return b.apy - a.apy;
  }

  return b.tvlUsd - a.tvlUsd;
};

async function fetchRawPools(): Promise<RawDefiLlamaPool[]> {
  const response = await fetch(DEFI_LLAMA_ENDPOINT, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch DeFi pools (${response.status})`);
  }

  const payload = (await response.json()) as { data?: RawDefiLlamaPool[] };
  if (!Array.isArray(payload.data)) {
    throw new Error("Unexpected DeFiLlama payload shape");
  }

  return payload.data;
}

function mapPoolToOpportunity(pool: RawDefiLlamaPool): DefiOpportunity | null {
  if (pool.apy === null || pool.tvlUsd === null) {
    return null;
  }

  const protocol = pool.project || pool.pool || "Unknown";

  return {
    id: pool.pool,
    protocol,
    chain: pool.chain,
    symbol: pool.symbol || pool.poolMeta || protocol,
    tvlUsd: Math.max(pool.tvlUsd ?? 0, 0),
    apy: Number(pool.apy ?? 0),
    apyBase: pool.apyBase ?? null,
    apyReward: pool.apyReward ?? null,
    apy1d: pool.apyPct1D ?? null,
    apy7d: pool.apyPct7D ?? null,
    apy30d: pool.apyPct30D ?? null,
    stablecoin: Boolean(pool.stablecoin),
    riskLevel: detectRisk(pool),
    category: detectCategory(protocol, pool),
    url: pool.url ?? undefined,
    details: pool.poolMeta ?? null,
    lastUpdated: pool.updatedAt ?? null,
  };
}

export const getDefiOpportunities = cache(
  async (params: FetchDefiOpportunitiesParams = {}): Promise<DefiOpportunitiesResponse> => {
    const [rawPools] = await Promise.all([fetchRawPools()]);

    const filtered = rawPools
      .map(mapPoolToOpportunity)
      .filter((opportunity): opportunity is DefiOpportunity => Boolean(opportunity))
      .filter((opportunity) => {
        if (params.minApy !== undefined && opportunity.apy < params.minApy) {
          return false;
        }
        if (params.stablecoinOnly && !opportunity.stablecoin) {
          return false;
        }
        if (params.chains && params.chains.length > 0) {
          const allowedChains = params.chains.map(normalize);
          if (!allowedChains.includes(normalize(opportunity.chain))) {
            return false;
          }
        }
        if (params.protocols && params.protocols.length > 0) {
          const allowedProtocols = params.protocols.map(normalize);
          if (!allowedProtocols.includes(normalize(opportunity.protocol))) {
            return false;
          }
        }
        return true;
      })
      .sort(sortOpportunities)
      .slice(0, params.maxResults ?? 200);

    const updated = filtered.reduce<number>((acc, item) => {
      if (item.lastUpdated && item.lastUpdated > acc) {
        return item.lastUpdated;
      }
      return acc;
    }, 0);

    return {
      updatedAt: updated || Date.now(),
      opportunities: filtered,
    };
  }
);
