import { LavVaultSimulator, VaultSimulationInput } from '@/lib/vaults/lav/simulator';
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

const ROUTE_ID = '/api/vaults/lav';

const DEFAULT_INPUT: VaultSimulationInput = {
  depositUsd: 1_000_000,
  tenorDays: 30,
  riskProfile: {
    id: 'conservative',
    name: 'LAV Conservative',
    targetReturnBps: 420,
    maxDrawdownBps: 180,
    liquidityBand: 'weekly',
  },
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_VAULTS_LAV_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_VAULTS_LAV_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Vaults LAV simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:vaults-lav');
  } catch (error) {
    logger.warn('Vaults LAV permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:vaults-lav');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<VaultSimulationInput>;
    const input: VaultSimulationInput = {
      ...DEFAULT_INPUT,
      ...body,
      riskProfile: {
        ...DEFAULT_INPUT.riskProfile,
        ...(body?.riskProfile ?? {}),
      },
    };

    const result = LavVaultSimulator.simulate(input);

    logger.info('Vaults LAV simulation executed', {
      correlationId,
      tenorDays: input.tenorDays,
      liquidityBand: input.riskProfile.liquidityBand,
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
        'X-Sim-Module': 'vaults-lav',
      }
    );
  } catch (error) {
    logger.error('Vaults LAV simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to simulate LAV vault');
  }
}
