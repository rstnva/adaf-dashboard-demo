import type {
  EquitiesProviderContext,
  EquityFundamentalSnapshot,
  EquityProvider,
  EquityTicker,
} from '@/lib/equities/types';
import { BaseEquityProvider, withDryRunFallback } from '@/lib/equities/providers/baseProvider';

interface FundamentalsProviderArgs {
  tickers: EquityTicker[];
  fields?: Array<keyof EquityFundamentalSnapshot>;
}

export class FundamentalsProvider
  extends BaseEquityProvider<FundamentalsProviderArgs, EquityFundamentalSnapshot[]>
  implements EquityProvider<FundamentalsProviderArgs, EquityFundamentalSnapshot[]>
{
  key = 'equities:fundamentals';
  description = 'Institutional fundamentals from FactSet/Bloomberg';
  supportedMarkets = ['US', 'CA', 'MX', 'EU'];

  protected async handleFetch(
    args: FundamentalsProviderArgs,
    context: EquitiesProviderContext
  ): Promise<EquityFundamentalSnapshot[]> {
    const fallback = withDryRunFallback(
      this.key,
      (): EquityFundamentalSnapshot[] =>
        args.tickers.map((ticker) => ({
          ticker,
          currency: 'USD',
          marketCapUsd: 100_000_000,
          peRatio: 15,
          forwardPeRatio: 14.5,
          pegRatio: 1.2,
          dividendYield: 0.012,
          revenueGrowthYoY: 0.08,
          epsGrowthYoY: 0.1,
          freeCashFlowMargin: 0.22,
          updatedAt: context.now().toISOString(),
          source: 'mock',
        })),
    );

    return fallback(async () => {
      // TODO: Integrate with enterprise fundamentals provider (e.g., FactSet API)
      // This scaffold intentionally returns mock data until the integration is wired.
      return args.tickers.map((ticker) => ({
        ticker,
        currency: 'USD',
        marketCapUsd: null,
        peRatio: null,
        forwardPeRatio: null,
        pegRatio: null,
        dividendYield: null,
        revenueGrowthYoY: null,
        epsGrowthYoY: null,
        freeCashFlowMargin: null,
        updatedAt: context.now().toISOString(),
        source: 'mock',
      }));
    }, context);
  }
}

export const fundamentalsProvider = new FundamentalsProvider();
