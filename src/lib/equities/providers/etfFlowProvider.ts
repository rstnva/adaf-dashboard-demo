import type {
  EquitiesProviderContext,
  EquityEtfFlowSnapshot,
  EquityProvider,
  EquityTicker,
} from '@/lib/equities/types';
import { BaseEquityProvider, withDryRunFallback } from '@/lib/equities/providers/baseProvider';

interface EtfFlowProviderArgs {
  tickers: EquityTicker[];
  lookbackDays?: number;
}

export class EtfFlowProvider
  extends BaseEquityProvider<EtfFlowProviderArgs, EquityEtfFlowSnapshot[]>
  implements EquityProvider<EtfFlowProviderArgs, EquityEtfFlowSnapshot[]>
{
  key = 'equities:etf-flows';
  description = 'Aggregates ETF primary flows and AUM shifts.';
  supportedMarkets = ['US'];

  protected async handleFetch(
    args: EtfFlowProviderArgs,
    context: EquitiesProviderContext
  ): Promise<EquityEtfFlowSnapshot[]> {
    const fallback = withDryRunFallback(
      this.key,
      (): EquityEtfFlowSnapshot[] =>
        args.tickers.map((ticker) => ({
          vehicle: `${ticker}-ETF`,
          ticker,
          netFlowUsd: 5_000_000,
          flow1DUsd: 1_500_000,
          flow5DUsd: 7_500_000,
          flow1MUsd: 22_000_000,
          aumUsd: 4_200_000_000,
          updatedAt: context.now().toISOString(),
          source: 'mock',
        })),
    );

    return fallback(async () => {
      // TODO: Wire into BlackRock/StateStreet institutional feed.
      return args.tickers.map((ticker) => ({
        vehicle: `${ticker}-ETF`,
        ticker,
        netFlowUsd: null,
        flow1DUsd: null,
        flow5DUsd: null,
        flow1MUsd: null,
        aumUsd: null,
        updatedAt: context.now().toISOString(),
        source: 'mock',
      }));
    }, context);
  }
}

export const etfFlowProvider = new EtfFlowProvider();
