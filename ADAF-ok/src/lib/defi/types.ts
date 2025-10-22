export interface RawDefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  pool: string;
  apy: number | null;
  apyBase?: number | null;
  apyReward?: number | null;
  apyPct1D?: number | null;
  apyPct7D?: number | null;
  apyPct30D?: number | null;
  tvlUsd: number | null;
  stablecoin?: boolean;
  underlyingTokens?: string[];
  rewardTokens?: string[];
  poolMeta?: string | null;
  url?: string | null;
  ilRisk?: string | null;
  auditScore?: number | null;
  exposure?: string | null;
  predictions?: {
    predictedClass?: string | null;
    predictedProbability?: number | null;
  } | null;
  updatedAt?: number | null;
}

export type DefiRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type DefiCategory =
  | 'lending'
  | 'lsd'
  | 'lsd-restaking'
  | 'perps'
  | 'structured'
  | 'dex'
  | 'aggregator'
  | 'points'
  | 'other';

export interface DefiOpportunity {
  id: string;
  protocol: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  apy1d: number | null;
  apy7d: number | null;
  apy30d: number | null;
  stablecoin: boolean;
  riskLevel: DefiRiskLevel;
  category: DefiCategory;
  url?: string;
  details?: string | null;
  lastUpdated: number | null;
}

export interface DefiOpportunitiesResponse {
  updatedAt: number;
  opportunities: DefiOpportunity[];
}
