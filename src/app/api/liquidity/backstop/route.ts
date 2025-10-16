import { LiquidityBackstopPlanner, LiquidityShockInput } from '@/lib/liquidity/backstop';
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

const ROUTE_ID = '/api/liquidity/backstop';

const DEFAULT_INPUT: LiquidityShockInput = {
  desk: 'adaf-mm',
  currentLiquidityUsd: 4_000_000,
  peakOutflowUsd: 6_500_000,
  volatilityIndex: 38,
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_LIQUIDITY_BACKSTOP_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_LIQUIDITY_BACKSTOP_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Liquidity backstop simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:liquidity-backstop');
  } catch (error) {
    logger.warn('Liquidity backstop permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:liquidity-backstop');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<LiquidityShockInput>;
    const input: LiquidityShockInput = {
      ...DEFAULT_INPUT,
      ...body,
    };

    const plan = LiquidityBackstopPlanner.plan(input);

    logger.info('Liquidity backstop simulation executed', {
      correlationId,
      desk: input.desk,
      topUpUsd: plan.topUpUsd,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: plan.status,
        request: input,
        plan,
      },
      {
        'X-Sim-Module': 'liquidity-backstop',
      }
    );
  } catch (error) {
    logger.error('Liquidity backstop simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to plan liquidity backstop');
  }
}
