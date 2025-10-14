import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type MaybePromise<T> = T | Promise<T>;

type RedisLike = {
  setnx(key: string, value: string): MaybePromise<number>;
  expire?(key: string, ttl: number): MaybePromise<number | void>;
};

type PrismaClientType = import('@prisma/client').PrismaClient;

const RawNewsSchema = z
  .object({
    title: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    link: z.string().optional(),
    feedUrl: z.string().optional(),
    published_at: z.string().optional(),
    pubDate: z.string().optional(),
    source: z.string().optional(),
    category: z.string().optional(),
    tickers: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
  })
  .passthrough();

type RawNewsInput = z.infer<typeof RawNewsSchema>;

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

type SeverityLevel = 'low' | 'medium' | 'critical';

type NewsSignal = z.infer<typeof NewsIngestSchema> & {
  fingerprint: string;
  signalId: string;
  severity: SeverityLevel;
  success: true;
};

function normalizeNews(raw: RawNewsInput) {
  return {
    title: raw.title ?? '',
    summary: raw.summary ?? raw.description ?? '',
    url: raw.url ?? raw.link ?? raw.feedUrl ?? '',
    published_at: raw.published_at ?? raw.pubDate ?? new Date().toISOString(),
    source: raw.source ?? 'Unknown',
    category: raw.category ?? '',
    tickers: raw.tickers ?? [],
    keywords: raw.keywords ?? [],
  } satisfies Partial<z.infer<typeof NewsIngestSchema>>;
}

function generateNewsHash(item: z.infer<typeof NewsIngestSchema>): string {
  const publishedAt = new Date(item.published_at).toISOString();
  const base = `${item.source}|${item.title.trim().toLowerCase()}|${item.url}|${publishedAt}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function classifySeverity(
  item: z.infer<typeof NewsIngestSchema>
): SeverityLevel {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  if (
    [
      'hack',
      'exploit',
      'breach',
      'depeg',
      'halt',
      'attack',
      'urgent',
      'security',
    ].some(keyword => text.includes(keyword))
  ) {
    return 'critical';
  }
  if (
    ['sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf', 'volatility'].some(
      keyword => text.includes(keyword)
    )
  ) {
    return 'medium';
  }
  return 'low';
}

let prismaClient: PrismaClientType | null = null;
async function getPrisma(): Promise<PrismaClientType> {
  if (!prismaClient) {
    const mod = await import('@prisma/client');
    prismaClient = new mod.PrismaClient();
  }
  return prismaClient;
}

let redisClient: RedisLike | null = null;
async function getRedis(): Promise<RedisLike> {
  if (!redisClient) {
    const mod = await import('ioredis');
    redisClient = new mod.default({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      db: 15,
    }) as RedisLike;
  }
  return redisClient;
}

function asRawNews(value: unknown): RawNewsInput | null {
  const parsed = RawNewsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function asNewsItem(
  raw: RawNewsInput
): z.infer<typeof NewsIngestSchema> | null {
  const normalized = normalizeNews(raw);
  const parsed = NewsIngestSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

function formatValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues;
  }
  return error;
}

async function persistNews(
  prisma: PrismaClientType,
  item: z.infer<typeof NewsIngestSchema>
) {
  await prisma.newsData.create({
    data: {
      title: item.title,
      description: item.summary ?? '',
      link: item.url,
      pubDate: new Date(item.published_at),
      source: item.source,
      sentiment: 0,
      keywords: item.keywords,
    },
  });
}

async function isDuplicate(
  prisma: PrismaClientType,
  item: z.infer<typeof NewsIngestSchema>
) {
  const existing = await prisma.newsData.findUnique({
    where: { link: item.url },
  });
  return Boolean(existing);
}

async function acquireRedisSlot(redis: RedisLike, hash: string) {
  const result = await Promise.resolve(redis.setnx(`dedupe:news:${hash}`, '1'));
  return Number(result) === 1;
}

function toSignal(
  item: z.infer<typeof NewsIngestSchema>,
  hash: string
): NewsSignal {
  const severity = classifySeverity(item);
  return {
    ...item,
    fingerprint: hash,
    signalId: hash,
    severity,
    success: true,
  };
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const redis = await getRedis();
  const pathname = request.nextUrl?.pathname ?? request.url ?? '';
  const isRss = pathname.endsWith('/news/rss');
  const payload: unknown = await request.json();

  if (isRss) {
    return handleRssIngest(prisma, redis, payload);
  }

  return handleStandardIngest(prisma, payload);
}

async function handleRssIngest(
  prisma: PrismaClientType,
  redis: RedisLike,
  payload: unknown
) {
  if (Array.isArray(payload)) {
    let processed = 0;
    const signals: NewsSignal[] = [];
    const errors: Array<Record<string, unknown>> = [];

    for (const entry of payload) {
      const raw = asRawNews(entry);
      if (!raw) {
        errors.push({
          error: 'validation error',
          details: formatValidationError(entry),
        });
        continue;
      }

      const item = asNewsItem(raw);
      if (!item) {
        errors.push({
          error: 'validation error',
          details: formatValidationError(raw),
        });
        continue;
      }

      const hash = generateNewsHash(item);
      const isNew = await acquireRedisSlot(redis, hash);
      if (!isNew) {
        errors.push({ error: 'already exists', fingerprint: hash });
        continue;
      }

      const signal = toSignal(item, hash);
      signals.push(signal);
      processed += 1;
    }

    const primary = signals[0] ?? null;
    return NextResponse.json(
      {
        success: signals.length > 0,
        signalId: primary?.signalId ?? null,
        fingerprint: primary?.fingerprint ?? null,
        severity: primary?.severity ?? null,
        signals,
        processed,
        errors,
      },
      { status: 200 }
    );
  }

  const raw = asRawNews(payload);
  if (!raw || (!raw.feedUrl && !raw.url && !raw.link)) {
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

  const item = asNewsItem(raw);
  if (!item) {
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

  const hash = generateNewsHash(item);
  if (await isDuplicate(prisma, item)) {
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

  await persistNews(prisma, item);
  const signal = toSignal(item, hash);
  return NextResponse.json(
    {
      success: true,
      signalId: hash,
      fingerprint: hash,
      severity: signal.severity,
      signals: [signal],
      processed: 1,
      errors: [],
    },
    { status: 200 }
  );
}

async function handleStandardIngest(
  prisma: PrismaClientType,
  payload: unknown
) {
  if (Array.isArray(payload)) {
    let processed = 0;
    const signals: NewsSignal[] = [];
    const errors: Array<Record<string, unknown>> = [];

    for (const entry of payload) {
      const raw = asRawNews(entry);
      if (!raw) {
        errors.push({
          error: 'validation error',
          details: formatValidationError(entry),
        });
        continue;
      }

      const item = asNewsItem(raw);
      if (!item) {
        errors.push({
          error: 'validation error',
          details: formatValidationError(raw),
        });
        continue;
      }

      if (await isDuplicate(prisma, item)) {
        errors.push({
          error: 'already exists',
          fingerprint: generateNewsHash(item),
        });
        continue;
      }

      await persistNews(prisma, item);
      const hash = generateNewsHash(item);
      const signal = toSignal(item, hash);
      signals.push(signal);
      processed += 1;
    }

    const primary = signals[0] ?? null;
    return NextResponse.json(
      {
        success: signals.length > 0,
        signalId: primary?.signalId ?? null,
        fingerprint: primary?.fingerprint ?? null,
        severity: primary?.severity ?? null,
        signals,
        processed,
        errors,
      },
      { status: 200 }
    );
  }

  const raw = asRawNews(payload);
  if (!raw) {
    return NextResponse.json(
      {
        success: false,
        error: 'validation error',
        details: formatValidationError(payload),
        signalId: null,
        fingerprint: null,
      },
      { status: 400 }
    );
  }

  const item = asNewsItem(raw);
  if (!item) {
    return NextResponse.json(
      {
        success: false,
        error: 'validation error',
        details: formatValidationError(raw),
        signalId: null,
        fingerprint: null,
      },
      { status: 400 }
    );
  }

  if (await isDuplicate(prisma, item)) {
    const hash = generateNewsHash(item);
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

  await persistNews(prisma, item);
  const hash = generateNewsHash(item);
  const severity = classifySeverity(item);
  return NextResponse.json(
    { success: true, signalId: hash, fingerprint: hash, severity, ...item },
    { status: 201 }
  );
}
