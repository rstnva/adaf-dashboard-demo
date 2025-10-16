import { NextRequest, NextResponse } from 'next/server';
import { fundamentalsProvider, priceProvider } from '@/lib/equities/providers';
import {
  buildSuccessResponse,
  enforceEquitiesAccess,
  handleApiError,
} from '@/app/api/equities/utils';
import { recordApiHit, recordCacheHit } from '@/lib/equities/metrics';

const ROUTE = '/api/equities/fundamentals';

export async function GET(request: NextRequest) {
  const access = await enforceEquitiesAccess(request, ROUTE);
  if (access instanceof NextResponse) {
    return access;
  }

  const { providerContext, runtime } = access;
  const tickersParam = request.nextUrl.searchParams.get('tickers');

  if (!tickersParam) {
    recordApiHit(ROUTE, 400);
    return NextResponse.json(
      {
        error: 'bad_request',
        message: 'Query param "tickers" is required (comma separated).',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const tickers = tickersParam
    .split(',')
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

  if (!tickers.length) {
    recordApiHit(ROUTE, 400);
    return NextResponse.json(
      {
        error: 'bad_request',
        message: 'No valid tickers provided.',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  try {
    const [fundamentals, prices] = await Promise.all([
      fundamentalsProvider.fetch({ tickers }, providerContext),
      priceProvider.fetch({ tickers }, providerContext),
    ]);

    if (fundamentals.every((snapshot) => snapshot.source === 'mock')) {
      recordCacheHit('dry-run');
    }

    return buildSuccessResponse(ROUTE, runtime, {
      tickers,
      dryRun: runtime.dryRun,
      fundamentals,
      prices,
    });
  } catch (error) {
    return handleApiError(ROUTE, error);
  }
}
