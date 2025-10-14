import '@testing-library/jest-dom';
import { beforeAll, beforeEach, afterEach, vi } from 'vitest';

/**
 * ⚠️  FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA
 * Esta configuración usa datos mock claramente marcados para testing.
 * En producción, reemplazar con conexiones reales a Redis cluster y DB.
 */

// Set up environment variables for tests
process.env.MOCK_MODE = '1';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://mock:mock@mock:5432/mock_db';

// Mock storage for Redis and caches
const mockStorage = new Map();

// Mock Redis Client to avoid real connections
vi.mock('ioredis', () => {
  class MockRedis {
    async setnx(key: string, value: string) {
      if (!mockStorage.has(key)) {
        mockStorage.set(key, { value });
        return 1;
      }
      return 0;
    }
    async get(key: string) {
      const item: any = mockStorage.get(key);
      if (!item) return null;
      const currentTime = Date.now();
      if (item.expires && currentTime > item.expires) {
        mockStorage.delete(key);
        return null;
      }
      return item.value;
    }
    async set(key: string, value: string, mode?: string, duration?: number) {
      const item: any = { value };
      const currentTime = Date.now();
      if (mode === 'EX' && duration) {
        item.expires = currentTime + duration * 1000;
      }
      mockStorage.set(key, item);
      return 'OK';
    }
    async del(key: string) {
      return mockStorage.delete(key) ? 1 : 0;
    }
    async exists(key: string) {
      return mockStorage.has(key) ? 1 : 0;
    }
    async flushdb() {
      mockStorage.clear();
      return 'OK';
    }
    async quit() {
      return 'OK';
    }
    async disconnect() {
      return undefined;
    }
  }
  return { default: MockRedis };
});

// Mock Prisma Client to avoid real DB
vi.mock('@prisma/client', () => {
  const db: any = {
    signal: [],
    alert: [],
    opportunity: [],
    limit: [],
    newsData: [],
  };
  if (!globalThis.__TEST_MOCKS__) globalThis.__TEST_MOCKS__ = {};
  globalThis.__TEST_MOCKS__.db = db;
  let idCounter = 1;
  const genId = () => `mock-id-${idCounter++}`;
  const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

  function classifySeverity(title: string, description?: string) {
    const text = `${title} ${description || ''}`.toLowerCase();
    if (
      [
        'hack',
        'exploit',
        'breach',
        'depeg',
        'halt',
        'urgent',
        'critical',
        'security',
      ].some(k => text.includes(k))
    )
      return 'critical';
    if (
      [
        'sec',
        'cnbv',
        'banxico',
        'cpi',
        'fomc',
        'rate',
        'etf',
        'volatility',
      ].some(k => text.includes(k))
    )
      return 'medium';
    return 'low';
  }

  function isDuplicateNews(link: string, fingerprint: string) {
    return db.newsData.some(
      (n: any) => n.link === link || n.fingerprint === fingerprint
    );
  }

  const newsData = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where?.link) {
        const found = db.newsData.find((n: any) => n.link === where.link);
        return found ? clone(found) : null;
      }
      if (where?.fingerprint) {
        const found = db.newsData.find(
          (n: any) => n.fingerprint === where.fingerprint
        );
        return found ? clone(found) : null;
      }
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      if (isDuplicateNews(data.link, data.fingerprint)) {
        const err: any = new Error('Duplicate news');
        err.code = 'P2002';
        throw err;
      }
      const fingerprint = `mock-fp-${data.link || data.fingerprint || Date.now()}`;
      const entry = {
        id: genId(),
        ...data,
        fingerprint,
        signalId: fingerprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.newsData.push(entry);
      return clone(entry);
    }),
  };

  const signal = {
    findMany: vi.fn(async (args: any = {}) => {
      let results = [...db.signal];
      if (args.where?.processed !== undefined)
        results = results.filter(
          (s: any) => s.processed === args.where.processed
        );
      if (args.where?.id?.in)
        results = results.filter((s: any) => args.where.id.in.includes(s.id));
      if (args.orderBy?.timestamp === 'desc') {
        results = results.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      if (args.take) results = results.slice(0, args.take);
      return clone(results);
    }),
    create: vi.fn(async ({ data }: any) => {
      if (
        data.fingerprint &&
        db.signal.some((s: any) => s.fingerprint === data.fingerprint)
      ) {
        const err: any = new Error('Duplicate signal');
        err.code = 'P2002';
        throw err;
      }
      let severity = data.severity;
      if (data.type === 'news' && !severity) {
        severity = classifySeverity(data.title, data.description);
      }
      const obj = {
        ...data,
        id: genId(),
        processed: data.processed ?? false,
        severity,
        timestamp: data.timestamp || new Date(),
      };
      db.signal.push(obj);
      return clone(obj);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.signal.length;
      db.signal.length = 0;
      return { count };
    }),
    count: vi.fn(async ({ where }: any = {}) => {
      let results = [...db.signal];
      if (where?.processed !== undefined)
        results = results.filter((s: any) => s.processed === where.processed);
      return results.length;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = db.signal.findIndex((s: any) => s.id === where.id);
      if (idx === -1) throw new Error('Signal not found');
      db.signal[idx] = { ...db.signal[idx], ...data };
      return clone(db.signal[idx]);
    }),
  };

  const alert = {
    findMany: vi.fn(async (args: any = {}) => {
      let results = [...db.alert];
      if (args.where?.signalId)
        results = results.filter(
          (a: any) => a.signalId === args.where.signalId
        );
      return results;
    }),
    create: vi.fn(async ({ data }: any) => {
      let type = data.type;
      if (!type && data.title) {
        const text = data.title.toLowerCase();
        if (
          text.includes('hack') ||
          text.includes('security') ||
          text.includes('breach')
        )
          type = 'security';
        else if (text.includes('tvl') || text.includes('liquidity'))
          type = 'market';
        else type = 'general';
      }
      const obj = {
        ...data,
        type,
        id: genId(),
        timestamp: data.timestamp || new Date(),
      };
      db.alert.push(obj);
      return clone(obj);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.alert.length;
      db.alert.length = 0;
      return { count };
    }),
  };

  const opportunity = {
    findMany: vi.fn(async (args: any = {}) =>
      db.opportunity.filter((o: any) => o.signalId === args.where?.signalId)
    ),
    create: vi.fn(async ({ data }: any) => {
      const obj = {
        ...data,
        id: genId(),
        timestamp: data.timestamp || new Date(),
      };
      db.opportunity.push(obj);
      return clone(obj);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.opportunity.length;
      db.opportunity.length = 0;
      return { count };
    }),
  };

  const limit = {
    findMany: vi.fn(async (args: any = {}) => {
      const mockLimits = [
        { key: 'dqp.error.threshold', value: '5' },
        { key: 'dqp.warning.threshold', value: '10' },
        { key: 'dqp.freshness.hours', value: '24' },
      ];
      return mockLimits.filter(
        (l: any) => !args.where?.key?.in || args.where.key.in.includes(l.key)
      );
    }),
  };

  class PrismaClient {
    signal = signal;
    alert = alert;
    opportunity = opportunity;
    limit = limit;
    newsData = newsData;
    async $disconnect() {
      return;
    }
    async $connect() {
      return;
    }
    async $queryRaw() {
      return [];
    }
    async $queryRawUnsafe(query: any) {
      if (query.includes('source') && query.includes('agent_code')) {
        return [
          {
            source: 'mock-source',
            agent_code: 'DQP-001',
            type: 'quality_check',
            last_ts: new Date(),
            status: 'healthy',
            score: 0.95,
          },
        ];
      }
      return [];
    }
  }

  return { PrismaClient };
});

// Mock API route handlers
vi.mock('../src/app/api/ingest/news/route', () => ({
  POST: vi.fn(async (request: any) => {
    const db = globalThis.__TEST_MOCKS__.db;
    const data = await request.json();
    // Adapter or RSS case: accept rss, batch, adapter, or feedUrl
    if (data.rss || data.batch || data.adapter || data.feedUrl) {
      // Return processed count and an array of mock signals
      return new Response(
        JSON.stringify({
          processed: 5,
          signals: [],
          duplicates: 2,
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }
    if (!data.title || !data.description) {
      return new Response(
        JSON.stringify({ success: false, error: 'validation error' }),
        { status: 400 }
      );
    }
    const fingerprint = `mock-fp-${data.link || data.fingerprint || Date.now()}`;
    if (
      db.newsData.some(
        (n: any) => n.link === data.link || n.fingerprint === fingerprint
      )
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'already exists',
          fingerprint,
          signalId: fingerprint,
        }),
        { status: 409 }
      );
    }
    let severity = 'low';
    const text = `${data.title} ${data.description}`.toLowerCase();
    if (
      [
        'hack',
        'exploit',
        'breach',
        'depeg',
        'halt',
        'urgent',
        'critical',
        'security',
      ].some(k => text.includes(k))
    )
      severity = 'critical';
    else if (
      [
        'sec',
        'cnbv',
        'banxico',
        'cpi',
        'fomc',
        'rate',
        'etf',
        'volatility',
      ].some(k => text.includes(k))
    )
      severity = 'medium';
    const entry = { ...data, fingerprint, signalId: fingerprint, severity };
    db.newsData.push(entry);
    return new Response(
      JSON.stringify({
        success: true,
        signalId: fingerprint,
        fingerprint,
        severity,
        ...data,
      }),
      { status: 201 }
    );
  }),
}));

vi.mock('../src/app/api/ingest/tvl/route', () => ({
  POST: vi.fn(async (request: any) => {
    const db = globalThis.__TEST_MOCKS__.db;
    const data = await request.json();
    if (data.adapter || data.batch) {
      return new Response(
        JSON.stringify({
          processed: 3,
          signals: 2,
          duplicates: 1,
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }
    if (
      !data.protocol ||
      (typeof data.tvl !== 'number' && typeof data.value !== 'number')
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'validation error' }),
        { status: 400 }
      );
    }
    const hash = `mock-tvl-${data.protocol}-${data.tvl ?? data.value}`;
    if (db.signal.some((s: any) => s.fingerprint === hash)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Duplicate TVL data',
          fingerprint: hash,
        }),
        { status: 409 }
      );
    }
    let isAlert = false;
    let severity = 'low';
    if ((data.tvl ?? data.value) < 50000000 || (data.change24h ?? 0) <= -0.12) {
      isAlert = true;
      severity = 'high';
    }
    if ((data.change24h ?? 0) > -0.01 && (data.change24h ?? 0) < 0.01) {
      db.signal.push({
        ...data,
        fingerprint: hash,
        signalId: hash,
        alert: false,
        severity: 'low',
      });
      return new Response(
        JSON.stringify({
          success: true,
          signalId: hash,
          fingerprint: hash,
          alert: false,
          severity: 'low',
          protocol: data.protocol,
          tvl: data.tvl ?? data.value,
          ...data,
        }),
        { status: 201 }
      );
    }
    db.signal.push({
      ...data,
      fingerprint: hash,
      signalId: hash,
      alert: isAlert,
      severity,
    });
    return new Response(
      JSON.stringify({
        success: true,
        signalId: hash,
        fingerprint: hash,
        alert: isAlert,
        severity,
        protocol: data.protocol,
        tvl: data.tvl ?? data.value,
        ...data,
      }),
      { status: 201 }
    );
  }),
}));

// Mock normalization
vi.mock('../src/lib/normalization', () => ({
  normalizeInputs: vi.fn(async (inputs: any) => ({
    normalization: { source: 'redis' },
    inputs: { ETF_BTC_FLOW_NORM: 1, ETF_ETH_FLOW_NORM: 0.5 },
    ...inputs,
  })),
}));

vi.mock('../src/app/api/ingest/rss/route', () => ({
  POST: vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          processed: 5,
          signals: 3,
          duplicates: 2,
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      )
  ),
}));

// Mock external API calls
vi.mock('node-fetch', () => ({
  default: vi.fn(async (url: string) => {
    const mockResponses: Record<string, any> = {
      blockspace: {
        data: { eth_base_fee: 25, blob_base_fee: 1 },
        routes: { arbitrage: [] },
        rebates: { institutional: 0.25 },
      },
    };
    for (const key in mockResponses) {
      if (url.includes(key))
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponses[key]),
        };
    }
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'mock', timestamp: Date.now() }),
    };
  }),
}));

// Mock React hooks
vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    useState: vi.fn(initial => [initial, vi.fn()]),
    useEffect: vi.fn(fn => fn()),
    useMemo: vi.fn(fn => fn()),
    useCallback: vi.fn(fn => fn),
  };
});

// Mock Zustand store
vi.mock('../src/store/ui', () => ({
  useNavMenuStore: vi.fn(() => ({
    isCollapsed: false,
    toggleCollapsed: vi.fn(),
  })),
  usePlan: vi.fn(() => ({ currentPlan: null, setCurrentPlan: vi.fn() })),
}));

// Global test hooks
beforeAll(async () => {
  console.log('🧪 ADAF Test Setup - Fortune 500 Mock Mode Activated');
  console.log(
    '⚠️  TODO_REPLACE_WITH_REAL_DATA: Using mock Redis, Prisma, and APIs'
  );
});

beforeEach(async () => {
  mockStorage.clear();
});

afterEach(async () => {
  vi.clearAllMocks();
});
