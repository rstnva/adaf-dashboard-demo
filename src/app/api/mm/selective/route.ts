import { SelectiveMarketMaker, MarketMakingMandate, VenueProfile } from '@/lib/mm/selectiveMarketMaker';
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

const ROUTE_ID = '/api/mm/selective';

const DEFAULT_MANDATE: MarketMakingMandate = {
  asset: 'wstETH',
  minInventoryUsd: 250_000,
  maxInventoryUsd: 1_500_000,
  targetSpreadBps: 18,
};

const DEFAULT_VENUES: VenueProfile[] = [
  { id: 'venue-1', name: 'Exchange A', qualityScore: 0.82, feeBps: 6 },
  { id: 'venue-2', name: 'Exchange B', qualityScore: 0.55, feeBps: 9 },
  { id: 'venue-3', name: 'MM Partner Desk', qualityScore: 0.91, feeBps: 4 },
];

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_MM_SELECTIVE_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_MM_SELECTIVE_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Selective MM simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:mm-selective');
  } catch (error) {
    logger.warn('Selective MM permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:mm-selective');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mandate?: MarketMakingMandate;
      venues?: VenueProfile[];
    };

    const mandate: MarketMakingMandate = {
      ...DEFAULT_MANDATE,
      ...(body?.mandate ?? {}),
    };
    const venues = Array.isArray(body?.venues) && body.venues.length > 0 ? body.venues : DEFAULT_VENUES;

    const decisions = SelectiveMarketMaker.evaluate(mandate, venues);

    logger.info('Selective MM simulation executed', {
      correlationId,
      venueCount: venues.length,
      provideLiquidity: decisions.filter(decision => decision.provideLiquidity).length,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: 'simulated',
        mandate,
        venues,
        decisions,
      },
      {
        'X-Sim-Module': 'mm-selective',
      }
    );
  } catch (error) {
    logger.error('Selective MM simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to evaluate selective market making');
  }
}
