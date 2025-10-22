import { requireDryRun } from '../../config/execution';
import { ingestNewsBatch } from '../ingestors';
import { getAnalysesWithEvents, getEventsByIds } from '../repository';
import { pushEventsToStandby } from '../standby/buffer';
import type { OrchestratorResult, PipelineConfig } from '../types';
import { runTriage } from './triageEngine';
import { recordNewsOracleRun } from '../../metrics';

export async function runNewsOracle(
  config: Partial<PipelineConfig> = {}
): Promise<OrchestratorResult> {
  requireDryRun();

  const startedAt = Date.now();
  const ingestion = await ingestNewsBatch(config);

  if (!ingestion.persistedIds.length) {
    return {
      ingested: ingestion.rawItems.length,
      deduped: ingestion.dedupedItems.length,
      standby: 0,
      escalated: 0,
      dismissed: 0,
      durationMs: Date.now() - startedAt,
    };
  }

  const events = await getEventsByIds(ingestion.persistedIds);
  const standby = await pushEventsToStandby(events, config);
  const analysesWithEvents = await getAnalysesWithEvents(
    standby.analyses.map(analysis => analysis.id)
  );

  const triageOutcome = await runTriage(
    analysesWithEvents.map(analysis => ({
      analysis,
      event: analysis.event,
    }))
  );

  const result: OrchestratorResult = {
    ingested: ingestion.rawItems.length,
    deduped: ingestion.dedupedItems.length,
    standby: standby.analyses.length,
    escalated: triageOutcome.escalated,
    dismissed: triageOutcome.dismissed,
    durationMs: Date.now() - startedAt,
  };

  recordNewsOracleRun(1, result.standby, result.escalated, result.dismissed);

  return result;
}
