import { TcaAnalyzer, TcaInput } from '@/lib/tca/analyzer';
import { requirePermission } from '@/lib/auth/rbac';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { requireDryRun } from '@/lib/config/execution';
import { logger } from '@/lib/logger';
import {
  createCorrelationId,
  flagDisabled,
  modeViolation,
  permissionDenied,
  simError,
  simSuccess,
} from '@/lib/api/simResponse';

const ROUTE_ID = '/api/tca';

const DEFAULT_INPUT: TcaInput = {
  orderId: 'order-sim-1',
  notionalUsd: 1_200_000,
  avgDailyVolumeUsd: 25_000_000,
  urgency: 'medium',
  venues: ['venue-1', 'venue-2', 'venue-3'],
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_TCA_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_TCA_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('TCA simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:tca');
  } catch (error) {
    logger.warn('TCA permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:tca');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<TcaInput>;
    const input: TcaInput = {
      ...DEFAULT_INPUT,
      ...body,
      venues: Array.isArray(body.venues) && body.venues.length > 0 ? body.venues : DEFAULT_INPUT.venues,
    };

    const breakdown = TcaAnalyzer.analyze(input);

    logger.info('TCA simulation executed', {
      correlationId,
      orderId: input.orderId,
      expectedSlippageBps: breakdown.expectedSlippageBps,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: breakdown.status,
        request: input,
        breakdown,
      },
      {
        'X-Sim-Module': 'tca',
      }
    );
  } catch (error) {
    logger.error('TCA simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to analyze transaction costs');
  }
}
