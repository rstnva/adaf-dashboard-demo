import { MetaAllocator, AllocationCandidate, AllocationConstraint } from '@/lib/allocator/meta/router';
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

const ROUTE_ID = '/api/allocator/meta';

const DEFAULT_CONSTRAINTS: AllocationConstraint[] = [
  {
    id: 'max-exposure',
    maxExposureBps: 2_500,
    minSharpe: 0.8,
    cooldownDays: 3,
  },
  {
    id: 'liquidity',
    maxExposureBps: 1_200,
    minSharpe: 0.6,
    cooldownDays: 1,
  },
];

const DEFAULT_CANDIDATE: AllocationCandidate = {
  signalId: 'alpha-btc-0',
  sharpe: 1.1,
  conviction: 0.7,
  capitalSuggestedUsd: 800_000,
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_ALPHA_FACTORY_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Meta allocator simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:alpha-factory');
  } catch (error) {
    logger.warn('Meta allocator permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:alpha-factory');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      capitalUsd?: number;
      candidate?: AllocationCandidate;
      constraints?: AllocationConstraint[];
    };

    const capitalUsd = body.capitalUsd ?? 2_000_000;
    const candidate: AllocationCandidate = {
      ...DEFAULT_CANDIDATE,
      ...(body?.candidate ?? {}),
    };
    const constraints = Array.isArray(body?.constraints) && body.constraints.length > 0 ? body.constraints : DEFAULT_CONSTRAINTS;

    const decision = MetaAllocator.allocate(capitalUsd, candidate, constraints);

    logger.info('Meta allocator simulation executed', {
      correlationId,
      signalId: candidate.signalId,
      capitalAllocatedUsd: decision.capitalAllocatedUsd,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: decision.status,
        capitalUsd,
        candidate,
        constraints,
        decision,
      },
      {
        'X-Sim-Module': 'allocator-meta',
      }
    );
  } catch (error) {
    logger.error('Meta allocator simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to execute meta allocator');
  }
}
