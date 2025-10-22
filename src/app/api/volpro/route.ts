import { VolProEngine, VolScenarioInput } from '@/lib/volpro/engine';
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

const ROUTE_ID = '/api/volpro';

const DEFAULT_INPUT: VolScenarioInput = {
  asset: 'eth',
  realizedVol: 0.62,
  impliedVol: 0.78,
  hedgeBudgetBps: 35,
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_VOL_PRO_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_VOL_PRO_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('VolPro simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:vol-pro');
  } catch (error) {
    logger.warn('VolPro permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:vol-pro');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<VolScenarioInput>;
    const input: VolScenarioInput = {
      ...DEFAULT_INPUT,
      ...body,
    };

    const result = VolProEngine.simulate(input);

    logger.info('VolPro simulation executed', {
      correlationId,
      asset: input.asset,
      hedgeNotionalUsd: result.hedgeNotionalUsd,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: result.status,
        scenario: input,
        result,
      },
      {
        'X-Sim-Module': 'vol-pro',
      }
    );
  } catch (error) {
    logger.error('VolPro simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to simulate volatility scenarios');
  }
}
