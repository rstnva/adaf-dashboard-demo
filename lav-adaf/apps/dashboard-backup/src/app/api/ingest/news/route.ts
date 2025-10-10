import { z } from 'zod';
import crypto from 'crypto';
import { createIngestHandler } from '../../../../lib/ingestUtils';

const NewsIngestSchema = z.object({
  source: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  published_at: z.string().datetime(),
  category: z.string().optional(),
  summary: z.string().optional(),
  tickers: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([])
});

function normalizeNews(input: any) {
  return {
    title: input.title,
    summary: input.summary || input.description || '',
    url: input.url || input.link,
    published_at: input.published_at || input.pubDate,
    source: input.source,
    category: input.category,
    tickers: input.tickers || [],
    keywords: input.keywords || []
  };
}

function generateNewsHash(item: z.infer<typeof NewsIngestSchema>): string {
  const publishedAt = new Date(item.published_at).toISOString();
  const base = `${item.source}|${item.title.trim().toLowerCase()}|${item.url}|${publishedAt}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function classifySeverity(item: z.infer<typeof NewsIngestSchema>): { severity: 'low' | 'med' | 'high' } {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  if (['hack', 'exploit', 'breach', 'depeg', 'halt'].some(k => text.includes(k))) return { severity: 'high' };
  if (['sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf'].some(k => text.includes(k))) return { severity: 'med' };
  return { severity: 'low' };
}

const inMemoryDedup = new Set<string>();
async function getRedis() {
  // Use in-memory deduplication for test/dev
  return {
    setnx: (key: string, val: string) => {
      if (inMemoryDedup.has(key)) return false;
      inMemoryDedup.add(key); return true;
    },
    expire: () => {}
  };
}

function responseShape(item: z.infer<typeof NewsIngestSchema>, hash: string, extra: any) {
  return { ...item, fingerprint: hash, ...extra };
}

export const POST = createIngestHandler({
  schema: NewsIngestSchema,
  dedupeKey: generateNewsHash,
  getRedis,
  classify: classifySeverity,
  responseShape,
  batchResponseShape: (signals, errors, processed) => ({ processed, signals, errors }),
});