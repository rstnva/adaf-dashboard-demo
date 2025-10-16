import type { NewsAnalysis, NewsEvent, NewsTriage } from '@prisma/client';
import { prisma } from '../prisma';
import type { PipelineNewsItem, StandbyAnalysis, TriageDecision } from './types';

export async function persistNewsEvents(
  items: PipelineNewsItem[]
): Promise<NewsEvent[]> {
  if (!items.length) return [];

  const operations = items.map(item =>
    prisma.newsEvent.upsert({
      where: { fingerprint: item.fingerprint },
      update: {
        source: item.source,
        title: item.title,
        url: item.url,
        summary: item.summary,
        category: item.category,
        publishedAt: new Date(item.published_at),
        tickers: item.tickers,
        keywords: item.keywords,
        status: 'deduped',
        priority: item.priority,
        dedupedAt: item.dedupedAt ? new Date(item.dedupedAt) : new Date(),
      },
      create: {
        fingerprint: item.fingerprint,
        source: item.source,
        title: item.title,
        url: item.url,
        summary: item.summary,
        category: item.category,
        publishedAt: new Date(item.published_at),
        tickers: item.tickers,
        keywords: item.keywords,
        status: 'deduped',
        priority: item.priority,
        dedupedAt: item.dedupedAt ? new Date(item.dedupedAt) : new Date(),
      },
    })
  );

  return prisma.$transaction(operations);
}

export async function createStandbyAnalyses(
  analyses: StandbyAnalysis[]
): Promise<NewsAnalysis[]> {
  if (!analyses.length) return [];

  const operations = analyses.map(analysis =>
    prisma.newsAnalysis.create({
      data: {
        eventId: analysis.eventId,
        sentiment: analysis.sentiment,
        impactScore: analysis.impactScore,
        confidenceScore: analysis.confidenceScore,
        riskLevel: analysis.riskLevel,
        status: analysis.status,
        standbyReason: analysis.standbyReason,
        tags: analysis.tags,
      },
    })
  );

  return prisma.$transaction(operations);
}

export async function upsertTriageDecisions(
  decisions: TriageDecision[]
): Promise<NewsTriage[]> {
  if (!decisions.length) return [];

  return prisma.$transaction(async tx => {
    const results: NewsTriage[] = [];

    for (const decision of decisions) {
      let existing: NewsTriage | null = null;

      if (typeof tx.newsTriage.findFirst === 'function') {
        existing = await tx.newsTriage.findFirst({
          where: { analysisId: decision.analysisId },
        });
      } else if (typeof tx.newsTriage.findMany === 'function') {
        const matches = await tx.newsTriage.findMany({
          where: { analysisId: decision.analysisId },
          take: 1,
        });
        existing = matches?.[0] ?? null;
      }

      if (existing) {
        const updated = await tx.newsTriage.update({
          where: { id: existing.id },
          data: {
            status: decision.status,
            escalatedTo: decision.escalatedTo,
            assignedTo: decision.assignedTo,
            notes: decision.notes,
          },
        });
        results.push(updated);
      } else {
        const created = await tx.newsTriage.create({
          data: {
            analysisId: decision.analysisId,
            status: decision.status,
            escalatedTo: decision.escalatedTo,
            assignedTo: decision.assignedTo,
            notes: decision.notes,
          },
        });
        results.push(created);
      }
    }

    return results;
  });
}

export async function listRecentNewsEvents(
  limit = 50
): Promise<NewsEvent[]> {
  return prisma.newsEvent.findMany({
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function getEventsByIds(ids: string[]): Promise<NewsEvent[]> {
  if (!ids.length) return [];

  return prisma.newsEvent.findMany({
    where: { id: { in: ids } },
  });
}

export async function listStandbyAnalyses(
  options: { status?: string; limit?: number } = {}
): Promise<
  Array<NewsAnalysis & { event: NewsEvent; triages: NewsTriage[] }>
> {
  const { status = 'standby', limit = 50 } = options;

  return prisma.newsAnalysis.findMany({
    where: { status },
    include: { event: true, triages: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getAnalysesWithEvents(
  ids: string[]
): Promise<Array<NewsAnalysis & { event: NewsEvent }>> {
  if (!ids.length) return [];

  return prisma.newsAnalysis.findMany({
    where: { id: { in: ids } },
    include: { event: true },
  });
}

export async function markEventStatus(
  eventId: string,
  status: NewsEvent['status']
): Promise<NewsEvent | null> {
  try {
    return await prisma.newsEvent.update({
      where: { id: eventId },
      data: { status },
    });
  } catch (error) {
    console.warn('news-repo: failed to mark event status', error);
    return null;
  }
}

export async function markEventsStatus(
  entries: Array<{ id: string; status: NewsEvent['status'] }>
): Promise<void> {
  if (!entries.length) return;

  await prisma.$transaction(
    entries.map(entry =>
      prisma.newsEvent.update({
        where: { id: entry.id },
        data: { status: entry.status },
      })
    )
  );
}

export async function markEventsStandby(
  eventIds: string[],
  standbyUntil: Date
): Promise<void> {
  if (!eventIds.length) return;

  await prisma.$transaction(
    eventIds.map(id =>
      prisma.newsEvent.update({
        where: { id },
        data: {
          status: 'standby',
          standbyUntil,
        },
      })
    )
  );
}

export async function markAnalysisStatus(
  analysisId: string,
  data: Pick<NewsAnalysis, 'status' | 'riskLevel'> & {
    standbyReason?: string | null;
  }
): Promise<NewsAnalysis | null> {
  try {
    return await prisma.newsAnalysis.update({
      where: { id: analysisId },
      data,
    });
  } catch (error) {
    console.warn('news-repo: failed to mark analysis status', error);
    return null;
  }
}

export async function getTriagedItems(
  limit = 50
): Promise<
  Array<NewsAnalysis & { event: NewsEvent; triages: NewsTriage[] }>
> {
  return prisma.newsAnalysis.findMany({
    where: {
      status: {
        in: ['escalated', 'dismissed'],
      },
    },
    include: { event: true, triages: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}
