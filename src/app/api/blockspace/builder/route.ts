import { BlockBuilderSimulator, BlockBuildRequest } from '@/lib/blockspace/builder';
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

const ROUTE_ID = '/api/blockspace/builder';

const DEFAULT_REQUEST: BlockBuildRequest = {
  bundleId: 'sim-demo-bundle',
  transactions: 42,
  expectedPayout: 75_000,
  preferences: {
    mevProtection: true,
    maxLatencyMs: 120,
  },
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_BLOCKSPACE_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_BLOCKSPACE_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Blockspace builder attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:blockspace');
  } catch (error) {
    logger.warn('Blockspace builder permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:blockspace');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<BlockBuildRequest>;
    const input: BlockBuildRequest = {
      ...DEFAULT_REQUEST,
      ...body,
      preferences: {
        ...DEFAULT_REQUEST.preferences,
        ...(body?.preferences ?? {}),
      },
    };

    const result = BlockBuilderSimulator.simulateBuild(input);

    logger.info('Blockspace builder simulation executed', {
      correlationId,
      bundleId: result.bundleId,
      accepted: result.accepted,
      latencyMs: result.latencyMs,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: result.status,
        request: input,
        result,
      },
      {
        'X-Sim-Module': 'blockspace-builder',
      }
    );
  } catch (error) {
    logger.error('Blockspace builder simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to simulate block build');
  }
}
