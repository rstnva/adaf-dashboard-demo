import type {
  EquityRecommendationAction,
  EquityRecommendationPackage,
  EquityRiskBudget,
  EquitySignal,
} from '@/lib/equities/types';

interface PortfolioConstructorInputs {
  sleeveId: string;
  sleeveName: string;
  riskBudget: EquityRiskBudget;
  signals: EquitySignal[];
  dryRun: boolean;
}

export function constructRecommendations(
  inputs: PortfolioConstructorInputs
): EquityRecommendationPackage {
  const actions: EquityRecommendationAction[] = inputs.signals.map((signal) => {
    const targetWeightBps = Math.min(
      inputs.riskBudget.maxPositionWeightBps,
      Math.max(0, Math.round(signal.compositeScore))
    );

    return {
      ticker: signal.ticker,
      action:
        signal.conviction === 'high'
          ? 'buy'
          : signal.conviction === 'medium'
          ? 'increase'
          : 'hold',
      targetWeightBps,
      expectedAlphaBps: Math.round(signal.compositeScore * 10),
      expectedVolatilityBps: 250,
      stopLossBps: inputs.riskBudget.stopLossBps,
      takeProfitBps: inputs.riskBudget.takeProfitBps,
      notes: 'Scaffold recommendation. Replace with validated optimizer outputs.',
    } satisfies EquityRecommendationAction;
  });

  return {
    id: `${inputs.sleeveId}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    generatedBy: 'equities-ai-scaffold',
    dryRun: inputs.dryRun,
    sleeve: inputs.sleeveName,
    regime: 'unknown',
    actions,
    signalsUsed: inputs.signals.map((signal) => signal.id),
  } satisfies EquityRecommendationPackage;
}
