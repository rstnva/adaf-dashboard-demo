import { AlphaFactory } from '@/lib/alpha/moat/factory';
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

const ROUTE_ID = '/api/alpha/factory';
const DEFAULT_UNIVERSE = ['btc', 'eth', 'sol', 'arb', 'op'];

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_ALPHA_FACTORY_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Alpha factory simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:alpha-factory');
  } catch (error) {
    logger.warn('Alpha factory permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:alpha-factory');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { universe?: string[] };
    const universe = Array.isArray(body.universe) && body.universe.length > 0 ? body.universe : DEFAULT_UNIVERSE;
    const signals = AlphaFactory.generateSignals(universe);

    logger.info('Alpha factory simulation executed', {
      correlationId,
      universe: universe.slice(0, 5),
      signalCount: signals.length,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: 'simulated',
        universe,
        signals,
      },
      {
        'X-Sim-Module': 'alpha-factory',
      }
    );
  } catch (error) {
    logger.error('Alpha factory simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to generate alpha signals');
  }
}
