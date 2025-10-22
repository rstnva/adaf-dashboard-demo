import { BlockspaceExecutionDesk, DeskExecution, DeskOrder } from '@/lib/blockspace/desk';
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

const ROUTE_ID = '/api/blockspace/desk';

const DEFAULT_ORDER: DeskOrder = {
  id: 'sim-desk-order',
  notionalUsd: 2_500_000,
  priority: 'fast',
  venue: 'relay',
  clientTier: 'plus',
};

function normalizeOrder(body: Partial<DeskOrder>): DeskOrder {
  const order: DeskOrder = {
    ...DEFAULT_ORDER,
    ...body,
  };
  if (!['relay', 'builder', 'sequencer'].includes(order.venue)) {
    order.venue = DEFAULT_ORDER.venue;
  }
  if (!['normal', 'fast', 'critical'].includes(order.priority)) {
    order.priority = DEFAULT_ORDER.priority;
  }
  if (!['basic', 'plus', 'pro'].includes(order.clientTier)) {
    order.clientTier = DEFAULT_ORDER.clientTier;
  }
  return order;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_BLOCKSPACE_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_BLOCKSPACE_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Blockspace desk attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:blockspace');
  } catch (error) {
    logger.warn('Blockspace desk permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:blockspace');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<DeskOrder>;
    const order = normalizeOrder(body);
    const execution: DeskExecution = BlockspaceExecutionDesk.route(order);

    logger.info('Blockspace desk simulation executed', {
      correlationId,
      orderId: execution.orderId,
      accepted: execution.accepted,
      feeBps: execution.feeBps,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: execution.status,
        order,
        execution,
      },
      {
        'X-Sim-Module': 'blockspace-desk',
      }
    );
  } catch (error) {
    logger.error('Blockspace desk simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to simulate execution desk');
  }
}
