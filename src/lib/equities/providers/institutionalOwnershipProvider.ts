import type {
  EquitiesProviderContext,
  EquityInstitutionalOwnership,
  EquityProvider,
  EquityTicker,
} from '@/lib/equities/types';
import { BaseEquityProvider, withDryRunFallback } from '@/lib/equities/providers/baseProvider';

interface InstitutionalOwnershipArgs {
  tickers: EquityTicker[];
  limit?: number;
}

export class InstitutionalOwnershipProvider
  extends BaseEquityProvider<InstitutionalOwnershipArgs, EquityInstitutionalOwnership[]>
  implements EquityProvider<InstitutionalOwnershipArgs, EquityInstitutionalOwnership[]>
{
  key = 'equities:institutional-ownership';
  description = 'Tracks 13F/13D/13G filings and conviction changes.';
  supportedMarkets = ['US'];

  protected async handleFetch(
    args: InstitutionalOwnershipArgs,
    context: EquitiesProviderContext
  ): Promise<EquityInstitutionalOwnership[]> {
    const fallback = withDryRunFallback(
      this.key,
      (): EquityInstitutionalOwnership[] =>
        args.tickers.flatMap((ticker) =>
          Array.from({ length: Math.min(args.limit ?? 5, 5) }, (_, index) => ({
            ticker,
            filer: `Mock Fund ${index + 1}`,
            filerType: '13F' as const,
            positionUsd: 50_000_000 - index * 5_000_000,
            shares: 500_000 - index * 50_000,
            weightBps: 1200 - index * 150,
            conviction: index === 0 ? 'increasing' : 'static',
            reportedAt: context.now().toISOString(),
            source: 'mock',
          }))
        ),
    );

    return fallback(async () => {
      // TODO: Connect to SEC/AlphaSense data lake.
      return args.tickers.map((ticker) => ({
        ticker,
        filer: 'Mock Fund',
        filerType: '13F',
        positionUsd: null,
        shares: null,
        weightBps: null,
        conviction: 'static',
        reportedAt: context.now().toISOString(),
        source: 'mock',
      }));
    }, context);
  }
}

export const institutionalOwnershipProvider = new InstitutionalOwnershipProvider();
