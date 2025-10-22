import type {
  EquitiesProviderContext,
  EquitySleeveConfiguration,
  EquitySleeveState,
  EquityRecommendationPackage,
  EquitySignal,
  EquityFundamentalSnapshot,
  EquityPriceSnapshot,
  EquityEtfFlowSnapshot,
  EquityInstitutionalOwnership,
} from '@/lib/equities/types';
import { fundamentalsProvider } from '@/lib/equities/providers/fundamentalsProvider';
import { priceProvider } from '@/lib/equities/providers/priceProvider';
import { etfFlowProvider } from '@/lib/equities/providers/etfFlowProvider';
import { institutionalOwnershipProvider } from '@/lib/equities/providers/institutionalOwnershipProvider';
import { runMultiFactorModel } from '@/lib/equities/strategies/multiFactorStrategy';
import { constructRecommendations } from '@/lib/equities/strategies/portfolioConstructor';
import { getEquitiesRuntimeConfig } from '@/lib/equities/config';

export interface SleeveEngineInputs {
  configuration: EquitySleeveConfiguration;
  tickers: string[];
  macroRegime?: 'risk-on' | 'risk-off' | 'neutral';
}

export interface SleeveEngineResult {
  sleeveState: EquitySleeveState;
  recommendations: EquityRecommendationPackage;
  signals: EquitySignal[];
  fundamentals: Record<string, EquityFundamentalSnapshot>;
  prices: Record<string, EquityPriceSnapshot>;
  etfFlows: EquityEtfFlowSnapshot[];
  ownership: EquityInstitutionalOwnership[];
}

export async function buildSleeveSnapshot(
  inputs: SleeveEngineInputs,
  context: EquitiesProviderContext
): Promise<SleeveEngineResult> {
  const runtime = getEquitiesRuntimeConfig();
  const now = context.now ?? (() => new Date());

  const [fundamentals, prices, etfFlows, ownership] = await Promise.all([
    fundamentalsProvider.fetch({ tickers: inputs.tickers }, context),
    priceProvider.fetch({ tickers: inputs.tickers }, context),
    etfFlowProvider.fetch({ tickers: inputs.tickers }, context),
    institutionalOwnershipProvider.fetch({ tickers: inputs.tickers }, context),
  ]);

  const fundamentalsDict = Object.fromEntries(
    fundamentals.map((item) => [item.ticker, item])
  );
  const pricesDict = Object.fromEntries(prices.map((item) => [item.ticker, item]));

  const signals = runMultiFactorModel(inputs.tickers, {
    fundamentals: fundamentalsDict,
    prices: pricesDict,
    macroRegime: inputs.macroRegime ?? 'neutral',
  });

  const recommendation = constructRecommendations({
    sleeveId: inputs.configuration.id,
    sleeveName: inputs.configuration.name,
    riskBudget: inputs.configuration.defaultRiskBudget,
    signals,
    dryRun: runtime.dryRun,
  });

  const sleeveState: EquitySleeveState = {
    sleeveId: inputs.configuration.id,
    displayName: inputs.configuration.name,
    description: inputs.configuration.mandate,
    baseCurrency: inputs.configuration.baseCurrency,
    hedging: false,
    dryRun: runtime.dryRun,
    riskBudget: inputs.configuration.defaultRiskBudget,
    openRecommendations: [recommendation],
    latestSignals: signals,
    fundamentals: fundamentalsDict,
    prices: pricesDict,
    etfFlows,
    institutionalOwnership: ownership,
    compliance: {
      requiresWetSignature: false,
      rebalanceWindow: 'pending',
      regionRestrictions: [],
      auditLogPermission: inputs.configuration.defaultPermissions[0] ?? 'feature:summer',
    },
    updatedAt: now().toISOString(),
  };

  return {
    sleeveState,
    recommendations: recommendation,
    signals,
    fundamentals: fundamentalsDict,
    prices: pricesDict,
    etfFlows,
    ownership,
  };
}
