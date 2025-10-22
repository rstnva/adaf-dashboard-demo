import type { Permission } from '@/lib/auth/rbac';

export type EquityTicker = `${string}:${string}` | string;

export type MarketRegime =
  | 'bull'
  | 'bear'
  | 'sideways'
  | 'volatile'
  | 'unknown';

export interface EquityFundamentalSnapshot {
  ticker: EquityTicker;
  currency: string;
  marketCapUsd: number | null;
  peRatio: number | null;
  forwardPeRatio: number | null;
  pegRatio: number | null;
  dividendYield: number | null;
  revenueGrowthYoY: number | null;
  epsGrowthYoY: number | null;
  freeCashFlowMargin: number | null;
  updatedAt: string; // ISO8601
  source: 'factset' | 'bloomberg' | 'intrinio' | 'tiingo' | 'mock';
}

export interface EquityPriceSnapshot {
  ticker: EquityTicker;
  price: number | null;
  currency: string;
  change1D: number | null;
  change5D: number | null;
  change1M: number | null;
  changeYtd: number | null;
  volume: number | null;
  volatility30D: number | null;
  updatedAt: string;
  source: 'polygon' | 'twelve-data' | 'alphavantage' | 'mock';
}

export interface EquityEtfFlowSnapshot {
  vehicle: string;
  ticker: EquityTicker;
  netFlowUsd: number | null;
  flow1DUsd: number | null;
  flow5DUsd: number | null;
  flow1MUsd: number | null;
  aumUsd: number | null;
  updatedAt: string;
  source: 'blackrock' | 'state-street' | 'factset' | 'morningstar' | 'mock';
}

export interface EquityInstitutionalOwnership {
  ticker: EquityTicker;
  filer: string;
  filerType: '13F' | '13D' | '13G' | 'institutional-report';
  positionUsd: number | null;
  shares: number | null;
  weightBps: number | null;
  conviction: 'increasing' | 'decreasing' | 'new' | 'exited' | 'static';
  reportedAt: string;
  source: 'sec' | 'alpha-sense' | 'tegus' | 'mock';
}

export interface EquityRiskBudget {
  maxPositionWeightBps: number;
  maxGrossExposure: number;
  maxNetExposure: number;
  stopLossBps: number;
  takeProfitBps: number;
  volatilityTarget: number;
}

export interface EquitySignalDimensions {
  momentumScore: number | null;
  qualityScore: number | null;
  valueScore: number | null;
  growthScore: number | null;
  sentimentScore: number | null;
  liquidityScore: number | null;
  macroScore: number | null;
}

export type SignalConfidence = 'low' | 'medium' | 'high';

export interface EquitySignal {
  id: string;
  ticker: EquityTicker;
  horizonDays: number;
  conviction: SignalConfidence;
  compositeScore: number;
  regime: MarketRegime;
  dimensions: EquitySignalDimensions;
  rationale: string;
  generatedAt: string;
  modelVersion: string;
  tags: string[];
}

export interface EquityRecommendationAction {
  ticker: EquityTicker;
  action: 'buy' | 'increase' | 'hold' | 'reduce' | 'exit';
  targetWeightBps: number;
  expectedAlphaBps: number | null;
  expectedVolatilityBps: number | null;
  stopLossBps?: number;
  takeProfitBps?: number;
  notes?: string;
}

export interface EquityRecommendationPackage {
  id: string;
  generatedAt: string;
  generatedBy: string;
  dryRun: boolean;
  sleeve: string;
  regime: MarketRegime;
  actions: EquityRecommendationAction[];
  signalsUsed: string[];
  auditTrailId?: string;
}

export interface EquitySleeveCompliance {
  requiresWetSignature: boolean;
  rebalanceWindow: 'open' | 'closed' | 'pending';
  regionRestrictions: string[];
  auditLogPermission: Permission;
}

export interface EquitySleeveState {
  sleeveId: string;
  displayName: string;
  description: string;
  baseCurrency: string;
  hedging: boolean;
  dryRun: boolean;
  riskBudget: EquityRiskBudget;
  openRecommendations: EquityRecommendationPackage[];
  latestSignals: EquitySignal[];
  fundamentals: Record<string, EquityFundamentalSnapshot>;
  prices: Record<string, EquityPriceSnapshot>;
  etfFlows: EquityEtfFlowSnapshot[];
  institutionalOwnership: EquityInstitutionalOwnership[];
  compliance: EquitySleeveCompliance;
  updatedAt: string;
}

export interface EquitiesProviderContext {
  dryRun: boolean;
  now: () => Date;
  cacheTtlMs: number;
  abortSignal?: AbortSignal;
}

export interface EquityProvider<TArgs = unknown, TResult = unknown> {
  key: string;
  description: string;
  supportedMarkets: string[];
  fetch(_args: TArgs, _context: EquitiesProviderContext): Promise<TResult>;
}

export interface EquitiesModelTelemetry {
  model: string;
  latencyMs: number;
  totalSignals: number;
  successfulSignals: number;
  warnings: number;
  dryRun: boolean;
}

export interface EquitiesBacktestRequest {
  sleeveId: string;
  startDate: string;
  endDate: string;
  benchmark: string;
  initialCapital: number;
  transactionCostBps: number;
  slippageBps: number;
  includeDrawdown: boolean;
}

export interface EquitiesBacktestResult {
  request: EquitiesBacktestRequest;
  cagr: number | null;
  sharpe: number | null;
  maxDrawdown: number | null;
  turnover: number | null;
  equityCurve: Array<{ date: string; value: number }>;
  benchmarkCurve: Array<{ date: string; value: number }>;
  notes?: string;
}

export interface EquitySleeveConfiguration {
  id: string;
  name: string;
  mandate: string;
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  baseCurrency: string;
  defaultRiskBudget: EquityRiskBudget;
  defaultPermissions: Permission[];
  dryRunDefault: boolean;
}
