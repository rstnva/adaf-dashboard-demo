import type {
  EquitiesProviderContext,
  EquityPriceSnapshot,
  EquityProvider,
  EquityTicker,
} from '@/lib/equities/types';
import { BaseEquityProvider, withDryRunFallback } from '@/lib/equities/providers/baseProvider';

interface PriceProviderArgs {
  tickers: EquityTicker[];
}

export class PriceProvider
  extends BaseEquityProvider<PriceProviderArgs, EquityPriceSnapshot[]>
  implements EquityProvider<PriceProviderArgs, EquityPriceSnapshot[]>
{
  key = 'equities:prices';
  description = 'Real-time and delayed equity pricing.';
  supportedMarkets = ['US', 'CA', 'MX', 'EU', 'APAC'];

  protected async handleFetch(
    args: PriceProviderArgs,
    context: EquitiesProviderContext
  ): Promise<EquityPriceSnapshot[]> {
    const fallback = withDryRunFallback(
      this.key,
      (): EquityPriceSnapshot[] =>
        args.tickers.map((ticker, index) => ({
          ticker,
          price: 100 + index,
          currency: 'USD',
          change1D: 0.01,
          change5D: 0.03,
          change1M: 0.08,
          changeYtd: 0.22,
          volume: 1_000_000,
          volatility30D: 0.25,
          updatedAt: context.now().toISOString(),
          source: 'mock',
        })),
    );

    return fallback(async () => {
      // TODO: Replace with Polygon/Alpaca/TwelveData integration.
      return args.tickers.map((ticker) => ({
        ticker,
        price: null,
        currency: 'USD',
        change1D: null,
        change5D: null,
        change1M: null,
        changeYtd: null,
        volume: null,
        volatility30D: null,
        updatedAt: context.now().toISOString(),
        source: 'mock',
      }));
    }, context);
  }
}

export const priceProvider = new PriceProvider();
