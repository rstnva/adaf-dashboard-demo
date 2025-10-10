import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const impact = url.searchParams.get('impact');
  // For demo: fetch from NewsData table, optionally filter by impact (severity)
  const news = await prisma.newsData.findMany({
    orderBy: { pubDate: 'desc' },
    take: limit,
  });
  // Map to frontend shape
  const mapped = news.map((n) => ({
    id: n.id.toString(),
    title: n.title,
    summary: n.description || '',
  impact: 'low',
    topic: n.keywords?.[0] || 'General',
    publishedAt: n.pubDate.toISOString(),
    url: n.link,
    source: n.source,
  })).filter(n => !impact || n.impact === impact);
  return NextResponse.json(mapped);
}
