import type { NewsAnalysis, NewsEvent } from '@prisma/client';
import { upsertTriageDecisions, markAnalysisStatus, markEventsStatus } from '../repository';
import type { TriageDecision } from '../types';
import { createNewsAlert, ensureNewsSignal } from './signalFactory';

export interface TriageContext {
  analysis: NewsAnalysis;
  event: NewsEvent;
}

export interface TriageOutcome {
  decisions: TriageDecision[];
  escalated: number;
  dismissed: number;
}

function shouldEscalate(context: TriageContext): boolean {
  const { analysis, event } = context;
  const sentiment = analysis.sentiment ?? 0;
  if (analysis.riskLevel === 'high') return true;
  if (event.priority === 'high' && sentiment < 0) return true;
  if (analysis.impactScore && analysis.impactScore >= 0.75 && sentiment <= -0.2)
    return true;
  return false;
}

function shouldDismiss(context: TriageContext): boolean {
  const { analysis, event } = context;
  const sentiment = analysis.sentiment ?? 0;

  if (analysis.riskLevel === 'low' && sentiment >= 0.4) return true;
  if (event.priority === 'normal' && sentiment >= 0.6) return true;
  return false;
}

export async function runTriage(
  contexts: TriageContext[]
): Promise<TriageOutcome> {
  if (!contexts.length) {
    return { decisions: [], escalated: 0, dismissed: 0 };
  }

  const decisions: TriageDecision[] = [];
  let escalated = 0;
  let dismissed = 0;

  for (const context of contexts) {
    const { analysis, event } = context;

    if (shouldEscalate(context)) {
      escalated += 1;
      decisions.push({
        analysisId: analysis.id,
        status: 'pending',
        escalatedTo: 'desk',
        notes: 'Escalado automáticamente por riesgo alto detectado',
      });
      await markAnalysisStatus(analysis.id, {
        status: 'escalated',
        riskLevel: analysis.riskLevel,
        standbyReason: analysis.standbyReason,
      });
      await ensureNewsSignal(event, analysis).then(signal =>
        createNewsAlert(signal, event, analysis)
      );
      continue;
    }

    if (shouldDismiss(context)) {
      dismissed += 1;
      decisions.push({
        analysisId: analysis.id,
        status: 'dismissed',
        notes: 'Descartado automáticamente por bajo impacto y sentimiento positivo',
      });
      await markAnalysisStatus(analysis.id, {
        status: 'dismissed',
        riskLevel: analysis.riskLevel,
        standbyReason: analysis.standbyReason,
      });
      continue;
    }

    decisions.push({
      analysisId: analysis.id,
      status: 'pending',
      notes: analysis.standbyReason ?? 'Pendiente de revisión manual',
    });
  }

  await upsertTriageDecisions(decisions);

  const triagedEvents = contexts
    .filter(ctx => shouldEscalate(ctx) || shouldDismiss(ctx))
    .map(ctx => ({ id: ctx.event.id, status: 'triaged' as const }));

  await markEventsStatus(triagedEvents);

  return { decisions, escalated, dismissed };
}
