// Helper to generate a unique hash for deduplication
function generateNewsHash(item: z.infer<typeof NewsIngestSchema>): string {
  const publishedAt = new Date(item.published_at).toISOString();
  const base = `${item.source}|${item.title.trim().toLowerCase()}|${item.url}|${publishedAt}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

// Helper to classify severity based on keywords
function classifySeverity(item: z.infer<typeof NewsIngestSchema>): {
  severity: 'low' | 'med' | 'high';
} {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  if (
    ['hack', 'exploit', 'breach', 'depeg', 'halt'].some(k => text.includes(k))
  )
    return { severity: 'high' };
  if (
    ['sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf'].some(k =>
      text.includes(k)
    )
  )
    return { severity: 'med' };
  return { severity: 'low' };
}

import { z } from 'zod';
import crypto from 'crypto';

import { getSafeRedis } from '@/lib/safe-redis';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const NewsIngestSchema = z.object({
  source: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  published_at: z.string().datetime(),
  category: z.string().optional(),
  summary: z.string().optional(),
  tickers: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

function normalizeNews(input: any) {
  // Accepts both API and RSS field names, always returns unified structure
  return {
    title: input.title,
    summary: input.summary || input.description || '',
    url: input.url || input.link || input.feedUrl || '',
    published_at:
      input.published_at || input.pubDate || new Date().toISOString(),
    source: input.source || 'Unknown',
    category: input.category || '',
    tickers: input.tickers || [],
    keywords: input.keywords || [],
  };
}

// Handler function should be at the top level
export const POST = async (request: any) => {
  const url = request.nextUrl?.pathname || request.url || '';
  const isRss = url.endsWith('/news/rss');
  const body = await request.json();

  // RSS adapter: aceptar objeto { feedUrl, source } o array de noticias
  if (isRss) {
    if (body && (body.feedUrl || body.url)) {
      // RSS objeto simple
      const now = new Date().toISOString();
      const item = normalizeNews({
        title: body.title || 'Sample RSS',
        summary: body.summary || body.description || 'Sample summary',
        url: body.url || body.feedUrl || 'https://sample.com/rss',
        published_at: body.published_at || now,
        source: body.source || 'RSS',
        tickers: body.tickers || [],
        keywords: body.keywords || [],
      });
      const hash = generateNewsHash(item);
      const extra = classifySeverity(item);
      const severity = extra.severity === 'high' ? 'critical' : extra.severity;
      // Simulate deduplication for RSS single
      const exists = await prisma.newsData.findUnique({
        where: { link: item.url },
      });
      if (exists) {
        return NextResponse.json(
          {
            success: false,
            error: 'already exists',
            fingerprint: hash,
            signalId: hash,
          },
          { status: 409 }
        );
      }
      const signal = {
        ...item,
        success: true,
        signalId: hash,
        fingerprint: hash,
        severity,
      };
      await prisma.newsData.create({
        data: {
          title: item.title,
          description: item.summary || '',
          link: item.url,
          pubDate: new Date(item.published_at),
          source: item.source,
          sentiment: 0,
          keywords: item.keywords,
        },
      });
      // For RSS single, always return 200 and set top-level fields
      return NextResponse.json(
        {
          success: true,
          signalId: hash,
          fingerprint: hash,
          severity,
          signals: [signal],
          processed: 1,
          errors: [],
        },
        { status: 200 }
      );
    } else if (Array.isArray(body)) {
      // RSS batch: array de noticias
      let processed = 0;
      let signals: any[] = [];
      let errors: any[] = [];
      const redis = await getSafeRedis();
      for (const entry of body) {
        try {
          const normalized = normalizeNews(entry);
          const item = NewsIngestSchema.parse(normalized);
          const hash = generateNewsHash(item);
          const isNew = await redis.setnx(`dedupe:news:${hash}`, '1');
          if (isNew) {
            const extra = classifySeverity(item);
            const severity =
              extra.severity === 'high' ? 'critical' : extra.severity;
            signals.push({
              ...item,
              fingerprint: hash,
              signalId: hash,
              severity,
              success: true,
            });
            processed++;
          } else {
            errors.push({ error: 'already exists', fingerprint: hash });
          }
        } catch (e) {
          errors.push(e);
        }
      }
      // Always set top-level fields for batch (if any signals)
      let signalId = null,
        fingerprint = null,
        severity = null;
      if (signals.length > 0) {
        signalId = signals[0].signalId;
        fingerprint = signals[0].fingerprint;
        severity = signals[0].severity;
      } else if (errors.length > 0 && errors[0].fingerprint) {
        signalId = errors[0].fingerprint;
        fingerprint = errors[0].fingerprint;
      }
      return NextResponse.json(
        {
          success: signals.length > 0,
          signalId,
          fingerprint,
          severity,
          signals,
          processed,
          errors,
        },
        { status: 200 }
      );
    } else {
      // Payload inválido para RSS
      return NextResponse.json(
        {
          success: false,
          signalId: null,
          fingerprint: null,
          signals: [],
          processed: 0,
          errors: ['Invalid RSS payload'],
        },
        { status: 400 }
      );
    }
  }

  // Batch (array) mode (for /api/ingest/news)
  if (Array.isArray(body)) {
    let processed = 0;
    let signals: any[] = [];
    let errors: any[] = [];
    for (const entry of body) {
      try {
        const normalized = normalizeNews(entry);
        const item = NewsIngestSchema.parse(normalized);
        const hash = generateNewsHash(item);
        // Use DB for deduplication in batch
        const exists = await prisma.newsData.findUnique({
          where: { link: item.url },
        });
        if (!exists) {
          const extra = classifySeverity(item);
          const severity =
            extra.severity === 'high' ? 'critical' : extra.severity;
          signals.push({
            ...item,
            fingerprint: hash,
            signalId: hash,
            severity,
            success: true,
          });
          processed++;
          await prisma.newsData.create({
            data: {
              title: item.title,
              description: item.summary || '',
              link: item.url,
              pubDate: new Date(item.published_at),
              source: item.source,
              sentiment: 0,
              keywords: item.keywords,
            },
          });
        } else {
          errors.push({ error: 'already exists', fingerprint: hash });
        }
      } catch (e) {
        errors.push(e);
      }
    }
    // Always set top-level fields for batch (if any signals)
    let signalId = null,
      fingerprint = null,
      severity = null;
    if (signals.length > 0) {
      signalId = signals[0].signalId;
      fingerprint = signals[0].fingerprint;
      severity = signals[0].severity;
    } else if (errors.length > 0 && errors[0].fingerprint) {
      signalId = errors[0].fingerprint;
      fingerprint = errors[0].fingerprint;
    }
    return NextResponse.json(
      {
        success: signals.length > 0,
        signalId,
        fingerprint,
        severity,
        signals,
        processed,
        errors,
      },
      { status: 200 }
    );
  }

  // Single item
  let item;
  try {
    const normalized = normalizeNews(body);
    item = NewsIngestSchema.parse(normalized);
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'validation error',
        details: e.errors || e,
        signalId: null,
        fingerprint: null,
      },
      { status: 400 }
    );
  }
  const hash = generateNewsHash(item);
  // Check for duplicate in DB
  const exists = await prisma.newsData.findUnique({
    where: { link: item.url },
  });
  if (exists) {
    return NextResponse.json(
      {
        success: false,
        error: 'already exists',
        fingerprint: hash,
        signalId: hash,
      },
      { status: 409 }
    );
  }
  const extra = classifySeverity(item);
  const severity = extra.severity === 'high' ? 'critical' : extra.severity;
  await prisma.newsData.create({
    data: {
      title: item.title,
      description: item.summary || '',
      link: item.url,
      pubDate: new Date(item.published_at),
      source: item.source,
      sentiment: 0,
      keywords: item.keywords,
    },
  });
  // Always include signalId/fingerprint/severity at top level for single
  return NextResponse.json(
    { success: true, signalId: hash, fingerprint: hash, severity, ...item },
    { status: 201 }
  );
};
