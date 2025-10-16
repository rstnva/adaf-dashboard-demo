import type {
  EquityFundamentalSnapshot,
  EquityPriceSnapshot,
  EquitySignal,
  EquityTicker,
  EquitySignalDimensions,
} from '@/lib/equities/types';

export interface MultiFactorInputs {
  fundamentals: Record<string, EquityFundamentalSnapshot>;
  prices: Record<string, EquityPriceSnapshot>;
  macroRegime: 'risk-on' | 'risk-off' | 'neutral';
}

const DEFAULT_WEIGHTS: Record<keyof EquitySignalDimensions, number> = {
  momentumScore: 0.2,
  qualityScore: 0.2,
  valueScore: 0.2,
  growthScore: 0.15,
  sentimentScore: 0.1,
  liquidityScore: 0.1,
  macroScore: 0.05,
};

function normalize(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value));
}

function computeDimensionScores(
  ticker: EquityTicker,
  inputs: MultiFactorInputs
): EquitySignalDimensions {
  const fundamental = inputs.fundamentals[ticker] ?? null;
  const price = inputs.prices[ticker] ?? null;

  const momentumScore = normalize(price?.change1M ?? null);
  const valueScore = normalize((fundamental?.peRatio ?? null) ? 1 / (fundamental?.peRatio ?? 1) : null);
  const qualityScore = normalize(fundamental?.freeCashFlowMargin ?? null);
  const growthScore = normalize(fundamental?.revenueGrowthYoY ?? null);
  const sentimentScore = normalize(price?.change5D ?? null);
  const liquidityScore = normalize(price?.volume ? Math.log(price.volume) / 20 : null);
  const macroScore = inputs.macroRegime === 'risk-on' ? 0.3 : inputs.macroRegime === 'risk-off' ? -0.3 : 0;

  return {
    momentumScore,
    qualityScore,
    valueScore,
    growthScore,
    sentimentScore,
    liquidityScore,
    macroScore,
  };
}

export function runMultiFactorModel(
  tickers: EquityTicker[],
  inputs: MultiFactorInputs,
  weights: Partial<Record<keyof EquitySignalDimensions, number>> = {}
): EquitySignal[] {
  const appliedWeights = { ...DEFAULT_WEIGHTS, ...weights };
  const weightSum = Object.values(appliedWeights).reduce((acc, weight) => acc + weight, 0);

  return tickers.map((ticker, index) => {
    const dimensions = computeDimensionScores(ticker, inputs);
    const compositeScore =
      (Object.entries(dimensions).reduce((acc, [dimension, score]) => {
        const weight = appliedWeights[dimension as keyof EquitySignalDimensions] ?? 0;
        return acc + score * weight;
      }, 0) /
        (weightSum || 1)) *
      100;

    return {
      id: `${ticker}-${Date.now()}-${index}`,
      ticker,
      horizonDays: 20,
      conviction: compositeScore > 20 ? 'high' : compositeScore > 5 ? 'medium' : 'low',
      compositeScore,
      regime: inputs.macroRegime === 'risk-off' ? 'bear' : inputs.macroRegime === 'risk-on' ? 'bull' : 'sideways',
      dimensions,
      rationale: 'Multi-factor blend scaffold. Replace with production-grade rationale generator.',
      generatedAt: new Date().toISOString(),
      modelVersion: 'scaffold-0.1.0',
      tags: ['scaffold', 'multi-factor'],
    } satisfies EquitySignal;
  });
}
