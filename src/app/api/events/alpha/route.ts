import { EventAlphaEngine, EventCatalyst } from '@/lib/events/eventAlphaEngine';
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

const ROUTE_ID = '/api/events/alpha';

const DEFAULT_CATALYSTS: EventCatalyst[] = [
  {
    id: 'macro-cpi',
    category: 'macro',
    severity: 'high',
    timeToEventHours: 24,
    affectedAssets: ['btc', 'eth'],
  },
  {
    id: 'dao-upgrade',
    category: 'protocol',
    severity: 'medium',
    timeToEventHours: 8,
    affectedAssets: ['uni'],
  },
];

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  if (process.env.NEXT_PUBLIC_FF_EVENT_ALPHA_SIM !== 'true') {
    return flagDisabled(ROUTE_ID, correlationId, startTime, FEATURE_FLAG_KEYS.FF_EVENT_ALPHA_SIM);
  }

  try {
    requireDryRun();
  } catch (error) {
    logger.warn('Event alpha simulation attempted outside dry-run', {
      correlationId,
      message: (error as Error).message,
    });
    return modeViolation(ROUTE_ID, correlationId, startTime, 'dry-run');
  }

  try {
    requirePermission('feature:event-alpha');
  } catch (error) {
    logger.warn('Event alpha permission denied', {
      correlationId,
      message: (error as Error).message,
    });
    return permissionDenied(ROUTE_ID, correlationId, startTime, 'feature:event-alpha');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { catalysts?: EventCatalyst[] };
    const catalysts = Array.isArray(body.catalysts) && body.catalysts.length > 0 ? body.catalysts : DEFAULT_CATALYSTS;

    const scores = EventAlphaEngine.scoreCatalysts(catalysts);

    logger.info('Event alpha simulation executed', {
      correlationId,
      catalystCount: catalysts.length,
    });

    return simSuccess(
      ROUTE_ID,
      correlationId,
      startTime,
      {
        status: 'simulated',
        catalysts,
        scores,
      },
      {
        'X-Sim-Module': 'event-alpha',
      }
    );
  } catch (error) {
    logger.error('Event alpha simulation failed', {
      correlationId,
      message: (error as Error).message,
    });
    return simError(ROUTE_ID, correlationId, startTime, 500, 'Failed to score event catalysts');
  }
}
