import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { getTriagedItems } from '@/lib/news/repository';

const FEATURE_ENABLED = process.env.NEXT_PUBLIC_FF_NEWS_ORACLE_ENABLED === 'true';

export async function GET(req: NextRequest) {
  if (!FEATURE_ENABLED) {
    return new Response(JSON.stringify({ error: 'feature_disabled' }), {
      status: 404,
    });
  }

  try {
    await requirePermission('feature:news_oracle');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'forbidden';
    return new Response(JSON.stringify({ error: message }), { status: 403 });
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(100, Number(limitParam)) : 50;

  try {
    const items = await getTriagedItems(limit);

    return new Response(
      JSON.stringify(
        items.map(item => ({
          analysis: {
            id: item.id,
            status: item.status,
            riskLevel: item.riskLevel,
            sentiment: item.sentiment,
            impactScore: item.impactScore,
            confidenceScore: item.confidenceScore,
            standbyReason: item.standbyReason,
            updatedAt: item.updatedAt,
            tags: item.tags,
          },
          event: {
            id: item.event.id,
            title: item.event.title,
            source: item.event.source,
            category: item.event.category,
            priority: item.event.priority,
            publishedAt: item.event.publishedAt,
            status: item.event.status,
            tickers: item.event.tickers,
            keywords: item.event.keywords,
            summary: item.event.summary,
          },
          triage: item.triages.map(decision => ({
            id: decision.id,
            status: decision.status,
            escalatedTo: decision.escalatedTo,
            assignedTo: decision.assignedTo,
            notes: decision.notes,
            updatedAt: decision.updatedAt,
          })),
        }))
      ),
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
