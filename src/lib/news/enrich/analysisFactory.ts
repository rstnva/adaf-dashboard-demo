import type { NewsEvent } from '@prisma/client';
import type { StandbyAnalysis } from '../types';
import { deriveRiskLevel, estimateImpact } from './impactScorer';
import { lexiconSentiment } from './sentimentEngine';

function computeConfidence(impact: number, sentiment: number): number {
  const base = 0.4;
  const impactWeight = impact * 0.4;
  const sentimentWeight = Math.abs(sentiment) * 0.2;
  return Number(Math.min(1, base + impactWeight + sentimentWeight).toFixed(2));
}

function standbyReasonFor(event: NewsEvent, risk: string): string {
  if (risk === 'high') {
    return 'Riesgo alto detectado - requiere triage inmediato';
  }
  if (event.priority === 'medium') {
    return 'Evento relevante en cola de análisis';
  }
  return 'Monitoreo en standby';
}

export async function buildStandbyAnalyses(
  events: NewsEvent[]
): Promise<StandbyAnalysis[]> {
  return events.map(event => {
    const sentiment = lexiconSentiment(`${event.title} ${event.summary ?? ''}`);
    const impactScore = estimateImpact(event);
    const riskLevel = deriveRiskLevel(impactScore, sentiment);
    const confidenceScore = computeConfidence(impactScore, sentiment);

    return {
      eventId: event.id,
      sentiment,
      impactScore,
      confidenceScore,
      riskLevel,
      status: 'standby',
      standbyReason: standbyReasonFor(event, riskLevel),
      tags: Array.from(new Set([event.category, ...event.keywords].filter(Boolean))) as string[],
    };
  });
}
