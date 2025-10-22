import { NextRequest, NextResponse } from 'next/server';
import {
  buildSuccessResponse,
  enforceEquitiesAccess,
  handleApiError,
} from '@/app/api/equities/utils';
import { fundamentalsProvider, priceProvider } from '@/lib/equities/providers';
import { runMultiFactorModel } from '@/lib/equities/strategies';
import { recordApiHit, recordCacheHit, recordModelTelemetry } from '@/lib/equities/metrics';

const ROUTE = '/api/equities/signals';

export async function GET(request: NextRequest) {
  const access = await enforceEquitiesAccess(request, ROUTE);
  if (access instanceof NextResponse) {
    return access;
  }

  const { providerContext, runtime } = access;
  const tickersParam = request.nextUrl.searchParams.get('tickers');
  const macroRegime =
    request.nextUrl.searchParams.get('macroRegime') ?? 'neutral';

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
    const startedAt = Date.now();
    const [fundamentals, prices] = await Promise.all([
      fundamentalsProvider.fetch({ tickers }, providerContext),
      priceProvider.fetch({ tickers }, providerContext),
    ]);

    if (fundamentals.every((snapshot) => snapshot.source === 'mock')) {
      recordCacheHit('dry-run');
    }

    const fundamentalsDict = Object.fromEntries(
      fundamentals.map((item) => [item.ticker, item])
    );
    const pricesDict = Object.fromEntries(
      prices.map((item) => [item.ticker, item])
    );

    const signals = runMultiFactorModel(tickers, {
      fundamentals: fundamentalsDict,
      prices: pricesDict,
      macroRegime:
        macroRegime === 'risk-on' || macroRegime === 'risk-off'
          ? (macroRegime as 'risk-on' | 'risk-off')
          : 'neutral',
    });

    recordModelTelemetry({
      model: 'multi-factor-scaffold',
      latencyMs: Date.now() - startedAt,
      totalSignals: signals.length,
      successfulSignals: signals.length,
      warnings: 0,
      dryRun: runtime.dryRun,
    });

    return buildSuccessResponse(ROUTE, runtime, {
      tickers,
      dryRun: runtime.dryRun,
      macroRegime,
      signals,
    });
  } catch (error) {
    return handleApiError(ROUTE, error);
  }
}
