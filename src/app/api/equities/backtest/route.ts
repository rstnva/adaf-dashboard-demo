import { NextRequest, NextResponse } from 'next/server';
import {
  buildSuccessResponse,
  enforceEquitiesAccess,
  handleApiError,
} from '@/app/api/equities/utils';
import { runEquitiesBacktest } from '@/lib/equities/backtest';
import { recordApiHit } from '@/lib/equities/metrics';
import type { EquitiesBacktestRequest } from '@/lib/equities/types';

const ROUTE = '/api/equities/backtest';

export async function POST(request: NextRequest) {
  const access = await enforceEquitiesAccess(request, ROUTE);
  if (access instanceof NextResponse) {
    return access;
  }

  const { runtime } = access;

  let body: EquitiesBacktestRequest;
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

  if (!body?.sleeveId || !body?.startDate || !body?.endDate || !body?.benchmark) {
    recordApiHit(ROUTE, 400);
    return NextResponse.json(
      {
        error: 'bad_request',
        message: 'Payload must include sleeveId, startDate, endDate, and benchmark.',
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
    const result = await runEquitiesBacktest(body);
    return buildSuccessResponse(
      ROUTE,
      runtime,
      {
        dryRun: runtime.dryRun,
        result,
      },
      {
        'Cache-Control': 'no-store',
      }
    );
  } catch (error) {
    return handleApiError(ROUTE, error);
  }
}
