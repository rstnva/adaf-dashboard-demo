import { createHash } from 'crypto';
import type { Alert, NewsAnalysis, NewsEvent, AgentSignal, Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { EXECUTION_CONFIG } from '../../config/execution';

function severityFromRisk(risk: string): 'low' | 'medium' | 'high' {
  if (risk === 'high') return 'high';
  if (risk === 'moderate') return 'medium';
  return 'low';
}

function fingerprintFor(event: NewsEvent): string {
  const hash = createHash('sha256');
  hash.update(`news-signal:${event.fingerprint}`);
  return hash.digest('hex');
}

export async function ensureNewsSignal(
  event: NewsEvent,
  analysis: NewsAnalysis
): Promise<AgentSignal> {
  const fingerprint = fingerprintFor(event);
  const metadata = {
    newsEventId: event.id,
    analysisId: analysis.id,
    tickers: event.tickers,
    keywords: event.keywords,
    sentiment: analysis.sentiment,
    impactScore: analysis.impactScore,
    confidenceScore: analysis.confidenceScore,
    simOnly: EXECUTION_CONFIG.isDryRun,
  };

  return prisma.agentSignal.upsert({
    where: { fingerprint },
    update: {
      title: event.title,
      description: event.summary ?? analysis.standbyReason ?? 'Headline sin resumen',
      severity: severityFromRisk(analysis.riskLevel),
      metadata,
      processed: false,
      timestamp: new Date(event.publishedAt),
      source: event.source,
    },
    create: {
      fingerprint,
      type: 'news.headline',
      source: event.source,
      title: event.title,
      description: event.summary ?? analysis.standbyReason ?? 'Headline sin resumen',
      severity: severityFromRisk(analysis.riskLevel),
      metadata,
      processed: false,
      timestamp: new Date(event.publishedAt),
    },
  });
}

function normalizeSignalMetadata(metadata: AgentSignal['metadata']): Prisma.JsonObject {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return { ...(metadata as Prisma.JsonObject) };
  }
  return {};
}

export async function createNewsAlert(
  signal: AgentSignal,
  event: NewsEvent,
  analysis: NewsAnalysis
): Promise<Alert> {
  const baseMetadata = normalizeSignalMetadata(signal.metadata);
  const mergedMetadata: Prisma.JsonObject = {
    ...baseMetadata,
    eventStatus: event.status,
    riskLevel: analysis.riskLevel,
    standbyReason: analysis.standbyReason ?? null,
    simulation: EXECUTION_CONFIG.isDryRun,
  };

  let existing: Alert | null = null;

  if (typeof prisma.alert.findFirst === 'function') {
    existing = await prisma.alert.findFirst({
      where: { signalId: signal.id },
    });
  } else if (typeof prisma.alert.findMany === 'function') {
    const matches = await prisma.alert.findMany({
      where: { signalId: signal.id },
      take: 1,
    } as never);
    existing = matches?.[0] ?? null;
  } else if (typeof prisma.alert.findUnique === 'function') {
    existing = await prisma.alert.findUnique({
      where: { signalId: signal.id },
    } as never);
  }

  if (existing) {
    return prisma.alert.update({
      where: { id: existing.id },
      data: {
        severity: severityFromRisk(analysis.riskLevel),
        description:
          analysis.standbyReason ?? event.summary ?? 'Evento de noticias registrado',
        metadata: mergedMetadata,
      },
    });
  }

  return prisma.alert.create({
    data: {
      signalId: signal.id,
      type: 'news',
      severity: severityFromRisk(analysis.riskLevel),
      title: event.title,
      description:
        analysis.standbyReason ?? event.summary ?? 'Evento de noticias registrado',
      metadata: mergedMetadata,
      timestamp: new Date(),
    },
  });
}
