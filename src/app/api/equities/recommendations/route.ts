import { NextRequest, NextResponse } from 'next/server';
import {
  buildSuccessResponse,
  enforceEquitiesAccess,
  handleApiError,
} from '@/app/api/equities/utils';
import { buildSleeveSnapshot } from '@/lib/equities/models';
import type { EquitySleeveConfiguration } from '@/lib/equities/types';
import { recordApiHit, recordModelTelemetry, recordRecommendation } from '@/lib/equities/metrics';

const ROUTE = '/api/equities/recommendations';

const DEFAULT_SLEEVE: EquitySleeveConfiguration = {
  id: 'equities-ai-sleeve',
  name: 'Equities AI Sleeve',
  mandate: 'Deliver institutional alpha via multi-factor + AI workflows.',
  rebalanceFrequency: 'weekly',
  baseCurrency: 'USD',
  defaultRiskBudget: {
    maxPositionWeightBps: 300,
    maxGrossExposure: 15000,
    maxNetExposure: 10000,
    stopLossBps: 500,
    takeProfitBps: 700,
    volatilityTarget: 0.18,
  },
  defaultPermissions: ['feature:equities-ai'],
  dryRunDefault: true,
};

interface RecommendationRequestBody {
  tickers?: string[] | string;
  configuration?: EquitySleeveConfiguration;
  macroRegime?: 'risk-on' | 'risk-off' | 'neutral';
}

export async function POST(request: NextRequest) {
  const access = await enforceEquitiesAccess(request, ROUTE);
  if (access instanceof NextResponse) {
    return access;
  }

  const { runtime, providerContext } = access;

  let body: RecommendationRequestBody;
  try {
    body = await request.json();
  } catch (error) {
    recordApiHit(ROUTE, 400);
    return NextResponse.json(
      {
        error: 'bad_request',
        message: 'Invalid JSON payload.',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const tickersSource = Array.isArray(body.tickers)
    ? body.tickers
    : typeof body.tickers === 'string'
    ? body.tickers.split(',')
    : [];

  const tickers = tickersSource
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

  if (!tickers.length) {
    recordApiHit(ROUTE, 400);
    return NextResponse.json(
      {
        error: 'bad_request',
        message: 'Payload must include at least one ticker.',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const configuration: EquitySleeveConfiguration = body.configuration
    ? {
        ...DEFAULT_SLEEVE,
        ...body.configuration,
        defaultPermissions: body.configuration.defaultPermissions?.length
          ? body.configuration.defaultPermissions
          : DEFAULT_SLEEVE.defaultPermissions,
      }
    : DEFAULT_SLEEVE;

  try {
    const startedAt = Date.now();

    const result = await buildSleeveSnapshot(
      {
        configuration,
        tickers,
        macroRegime: body.macroRegime,
      },
      providerContext
    );

    recordModelTelemetry({
      model: 'sleeve-engine-scaffold',
      latencyMs: Date.now() - startedAt,
      totalSignals: result.signals.length,
      successfulSignals: result.signals.length,
      warnings: 0,
      dryRun: runtime.dryRun,
    });
    recordRecommendation(runtime.dryRun);

    return buildSuccessResponse(
      ROUTE,
      runtime,
      {
        tickers,
        dryRun: runtime.dryRun,
        sleeveState: result.sleeveState,
        recommendation: result.recommendations,
        signals: result.signals,
        fundamentals: result.fundamentals,
        prices: result.prices,
        etfFlows: result.etfFlows,
        ownership: result.ownership,
      },
      {
        'Cache-Control': 'no-store',
      }
    );
  } catch (error) {
    return handleApiError(ROUTE, error);
  }
}
