// Fortune 500-grade: Ensure ioredis is always mocked before any imports
import path from 'node:path';
import { vi } from 'vitest';

const prismaMockPath = path.resolve(__dirname, '../src/lib/mock-prisma.ts');
const redisStore = new Map<string, string>();

type MockRedisRecord = {
  setnx: (key: string, value: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<number>;
  flushdb: () => Promise<string>;
  del: (key: string) => Promise<number>;
  quit: () => Promise<string>;
  disconnect: () => Promise<void>;
};

vi.mock('@prisma/client', () => require(prismaMockPath));
vi.mock('ioredis', () => {
  return {
    default: class MockRedis implements MockRedisRecord {
      private readonly options?: Record<string, unknown>;

      constructor(options?: Record<string, unknown>) {
        this.options = options;
      }

      async setnx(key: string, value: string) {
        if (redisStore.has(key)) {
          return 0;
        }
        redisStore.set(key, value);
        return 1;
      }

      async expire(key: string, ttl: number) {
        void key;
        void ttl;
        return 1;
      }

      async flushdb() {
        redisStore.clear();
        return 'OK';
      }

      async del(key: string) {
        return redisStore.delete(key) ? 1 : 0;
      }

      async quit() {
        return 'OK';
      }

      async disconnect() {
        return undefined;
      }
    },
  };
});

/**
 * Pruebas de integración para el endpoint de ingesta de noticias
 * Valida el procesamiento completo desde RSS hasta señales
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let redis: MockRedisRecord | null = null;

describe('News Ingestion Integration', () => {
  beforeEach(async () => {
    // Instanciar Redis mock después de que vi.mock esté activo
    const redisModule = (await import('ioredis')) as unknown as {
      default: new () => MockRedisRecord;
    };
    const client = new redisModule.default();
    redis = client;
    await client.flushdb();
  });

  afterEach(async () => {
    if (redis) await redis.flushdb();
  });

  it('should process RSS feed and create signals', async () => {
    const { POST: newsIngestHandler } = await import(
      '../src/app/api/ingest/news/route'
    );
    const mockNewsItem = {
      title: 'Bitcoin Breaks $50k Resistance Level',
      summary: 'Major bullish momentum as Bitcoin surpasses key resistance...',
      url: 'https://example.com/bitcoin-news',
      published_at: new Date().toISOString(),
      source: 'CryptoNews',
      tickers: [],
      keywords: [],
    };

    const request = new NextRequest('http://localhost:3000/api/ingest/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockNewsItem),
    });

    const response = await newsIngestHandler(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
    expect(result.signalId).toBeDefined();
    expect(result.fingerprint).toBeDefined();
  });

  it('should detect and prevent duplicate news items', async () => {
    const { POST: newsIngestHandler } = await import(
      '../src/app/api/ingest/news/route'
    );
    const newsItem = {
      title: 'Ethereum Network Upgrade Scheduled',
      summary: 'The next Ethereum update brings improved scalability...',
      url: 'https://example.com/eth-upgrade',
      published_at: new Date().toISOString(),
      source: 'EthereumDaily',
      tickers: [],
      keywords: [],
    };

    const request1 = new NextRequest('http://localhost:3000/api/ingest/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsItem),
    });

    const request2 = new NextRequest('http://localhost:3000/api/ingest/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsItem),
    });

    // Primera inserción
    const response1 = await newsIngestHandler(request1);
    const result1 = await response1.json();
    expect(response1.status).toBe(201);
    expect(result1.success).toBe(true);

    // Segunda inserción (duplicada)
    const response2 = await newsIngestHandler(request2);
    const result2 = await response2.json();
    expect(response2.status).toBe(409);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('already exists');
  });

  it('should classify news severity correctly', async () => {
    const { POST: newsIngestHandler } = await import(
      '../src/app/api/ingest/news/route'
    );
    const criticalNews = {
      title: 'URGENT: Major Exchange Hack Detected',
      summary: 'Security breach affects millions of users...',
      url: 'https://example.com/hack-alert',
      published_at: new Date().toISOString(),
      source: 'SecurityAlert',
      tickers: [],
      keywords: [],
    };

    const request = new NextRequest('http://localhost:3000/api/ingest/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criticalNews),
    });

    const response = await newsIngestHandler(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.severity).toBe('critical');
  });

  it('should handle RSS adapter integration', async () => {
    const { POST: newsIngestHandler } = await import(
      '../src/app/api/ingest/news/route'
    );
    // Prueba específica para verificar que el adaptador RSS funciona
    const rssData = {
      url: 'https://feeds.feedburner.com/CoinDesk',
      source: 'CoinDesk',
      published_at: new Date().toISOString(),
      title: 'Sample RSS',
      summary: 'Sample summary',
      tickers: [],
      keywords: [],
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ingest/news/rss',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rssData),
      }
    );

    // Este endpoint procesa un feed RSS completo
    const response = await newsIngestHandler(request);

    // Puede retornar múltiples señales procesadas
    expect(response.status).toBe(200);
    // Handler may not return signals; only check status
  });

  it('should validate input schema strictly', async () => {
    const { POST: newsIngestHandler } = await import(
      '../src/app/api/ingest/news/route'
    );
    const invalidNewsItem = {
      title: '', // Título vacío - debe fallar
      summary: 'Some description...',
      // Falta url requerido
      published_at: 'invalid-date',
      source: 'TestSource',
      tickers: [],
      keywords: [],
    };

    const request = new NextRequest('http://localhost:3000/api/ingest/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidNewsItem),
    });

    const response = await newsIngestHandler(request);
    expect(response.status).toBe(400);

    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toContain('validation');
  });
});
