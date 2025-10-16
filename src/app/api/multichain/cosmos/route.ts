import { CosmosExecutor, CosmosTask } from '@/lib/multichain/cosmos/executor';
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

const ROUTE_ID = '/api/multichain/cosmos';

const DEFAULT_TASK: CosmosTask = {
  id: 'cosmos-task-1',
  chain: 'cosmoshub',
  action: 'delegate',
  notionalUsd: 150_000,
  slippageBps: 25,
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_COSMOS_EXECUTOR_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_COSMOS_EXECUTOR_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Cosmos executor simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:cosmos-executor');
  } catch (error) {
    logger.warn('Cosmos executor permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:cosmos-executor');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<CosmosTask>;
    const task: CosmosTask = {
      ...DEFAULT_TASK,
      ...body,
    };

    const result = CosmosExecutor.enqueue(task);

    logger.info('Cosmos executor simulation executed', {
      correlationId,
      chain: task.chain,
      accepted: result.accepted,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: result.status,
        task,
        result,
      },
      {
        'X-Sim-Module': 'cosmos-executor',
      }
    );
  } catch (error) {
    logger.error('Cosmos executor simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to enqueue cosmos task');
  }
}
