import type { NewsEvent, NewsAnalysis } from '@prisma/client';
import { DEFAULT_NEWS_PIPELINE_CONFIG } from '../config';
import { createStandbyAnalyses, markEventsStandby } from '../repository';
import type { PipelineConfig } from '../types';
import { buildStandbyAnalyses } from '../enrich/analysisFactory';

export interface StandbyResult {
  analyses: NewsAnalysis[];
  standbyUntil: Date;
}

export async function pushEventsToStandby(
  events: NewsEvent[],
  config: Partial<PipelineConfig> = {}
): Promise<StandbyResult> {
  if (!events.length) {
    return { analyses: [], standbyUntil: new Date() };
  }

  const effectiveConfig = {
    ...DEFAULT_NEWS_PIPELINE_CONFIG,
    ...config,
  };

  const standbyMinutes = effectiveConfig.standbyMinutes;
  const standbyUntil = new Date(Date.now() + standbyMinutes * 60 * 1000);

  const analysesInput = await buildStandbyAnalyses(events);

  await markEventsStandby(
    events.map(event => event.id),
    standbyUntil
  );

  const analyses = await createStandbyAnalyses(analysesInput);

  return {
    analyses,
    standbyUntil,
  };
}
