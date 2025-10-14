// FORTUNE 500: Ensure ioredis mock is registered first
import { vi } from 'vitest';
import type { DependencyList, Dispatch, SetStateAction } from 'react';

// Fortune 500: Robust ioredis mock registration
type StoredValue = {
  value: string;
  expires?: number;
};

const mockStorage = new Map<string, StoredValue>();

class MockRedis {
  async setnx(key: string, value: string) {
    if (mockStorage.has(key)) return 0;
    mockStorage.set(key, { value });
    return 1;
  }
  async expire(key: string, seconds: number) {
    const item = mockStorage.get(key);
    if (!item) return 0;
    mockStorage.set(key, { ...item, expires: Date.now() + seconds * 1000 });
    return 1;
  }
  async get(key: string) {
    const item = mockStorage.get(key);
    if (!item) return null;
    const currentTime = Date.now();
    if (item.expires && currentTime > item.expires) {
      mockStorage.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key: string, value: string, mode?: string, duration?: number) {
    const currentTime = Date.now();
    const entry: StoredValue = { value };
    if (mode === 'EX' && typeof duration === 'number') {
      entry.expires = currentTime + duration * 1000;
    }
    mockStorage.set(key, entry);
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
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on(_event: string, _cb: (...args: unknown[]) => void) {
    /* no-op for event listeners */ return this;
  }
}
globalThis.MockRedis = MockRedis;
module.exports.MockRedis = MockRedis;
vi.mock('ioredis', () => {
  return { default: MockRedis, Redis: MockRedis };
});

import '@testing-library/jest-dom';
import { beforeAll, beforeEach, afterEach } from 'vitest';

// FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA
process.env.MOCK_MODE = '1';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://mock:mock@mock:5432/mock_db';

// Export for redis-config.ts and attach to globalThis
globalThis.MockRedis = MockRedis;
module.exports.MockRedis = MockRedis;

vi.mock('@prisma/client', () => {
  type SignalRecord = {
    id: string;
    type: string;
    title: string;
    description?: string;
    severity?: string;
    fingerprint?: string;
    processed: boolean;
    timestamp: Date;
    [key: string]: unknown;
  };

  type SignalCreateInput = {
    id?: string;
    type: string;
    title: string;
    description?: string;
    severity?: string;
    fingerprint?: string;
    processed?: boolean;
    timestamp?: Date;
    [key: string]: unknown;
  };

  type AlertRecord = {
    id: string;
    signalId?: string;
    type: string;
    timestamp: Date;
    [key: string]: unknown;
  };

  type AlertCreateInput = {
    id?: string;
    signalId?: string;
    timestamp?: Date;
    type?: string;
    [key: string]: unknown;
  };

  type OpportunityRecord = {
    id: string;
    signalId?: string;
    timestamp: Date;
    [key: string]: unknown;
  };

  type OpportunityCreateInput = {
    id?: string;
    signalId?: string;
    timestamp?: Date;
    [key: string]: unknown;
  };

  type LimitRecord = {
    key: string;
    value: string;
  };

  type NewsRecord = {
    id: string;
    link: string;
    fingerprint: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };

  type NewsCreateInput = {
    id?: string;
    link: string;
    fingerprint: string;
    [key: string]: unknown;
  };

  const db = {
    signal: [] as SignalRecord[],
    alert: [] as AlertRecord[],
    opportunity: [] as OpportunityRecord[],
    limit: [] as LimitRecord[],
    newsData: [] as NewsRecord[],
  };

  let idCounter = 1;
  const genId = () => `mock-id-${idCounter++}`;
  const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T;

  const classifySeverity = (title: string, description?: string) => {
    const text = `${title} ${description ?? ''}`.toLowerCase();
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
  };

  const isDuplicateSignal = (fingerprint?: string) => {
    if (!fingerprint) return false;
    return db.signal.some(s => s.fingerprint === fingerprint);
  };

  const isDuplicateNews = (link: string, fingerprint: string) => {
    return db.newsData.some(
      n => n.link === link || n.fingerprint === fingerprint
    );
  };

  const newsData = {
    findUnique: vi.fn(
      async ({
        where,
      }: {
        where?: { link?: string; fingerprint?: string };
      }) => {
        if (!where) return null;
        if (where.link) {
          const found = db.newsData.find(n => n.link === where.link);
          return found ? clone(found) : null;
        }
        if (where.fingerprint) {
          const found = db.newsData.find(
            n => n.fingerprint === where.fingerprint
          );
          return found ? clone(found) : null;
        }
        return null;
      }
    ),
    create: vi.fn(async ({ data }: { data: NewsCreateInput }) => {
      if (isDuplicateNews(data.link, data.fingerprint)) {
        const err = new Error('Duplicate news') as Error & { code?: string };
        err.code = 'P2002';
        throw err;
      }
      const entry: NewsRecord = {
        ...data,
        id: data.id ?? genId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.newsData.push(entry);
      return clone(entry);
    }),
  };

  const signal = {
    findMany: vi.fn(
      async (
        args: {
          where?: {
            processed?: boolean;
            id?: string | { in: string[] };
            title?: string;
          };
          orderBy?: { timestamp?: 'asc' | 'desc' };
          take?: number;
        } = {}
      ) => {
        let results = [...db.signal];
        const { where, orderBy, take } = args;
        if (where) {
          if (where.processed !== undefined)
            results = results.filter(s => s.processed === where.processed);
          const idFilter = where.id;
          if (typeof idFilter === 'string') {
            results = results.filter(s => s.id === idFilter);
          } else if (
            idFilter &&
            'in' in idFilter &&
            Array.isArray(idFilter.in)
          ) {
            results = results.filter(s => idFilter.in.includes(s.id));
          }
          if (where.title)
            results = results.filter(s => s.title === where.title);
        }
        if (orderBy?.timestamp === 'desc') {
          results = results.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );
        }
        if (typeof take === 'number') results = results.slice(0, take);
        return clone(results);
      }
    ),
    create: vi.fn(async ({ data }: { data: SignalCreateInput }) => {
      if (isDuplicateSignal(data.fingerprint)) {
        const err = new Error('Duplicate signal') as Error & { code?: string };
        err.code = 'P2002';
        throw err;
      }
      const severity =
        data.type === 'news' && !data.severity
          ? classifySeverity(data.title, data.description)
          : data.severity;
      const record: SignalRecord = {
        ...data,
        severity,
        id: data.id ?? genId(),
        processed: data.processed ?? false,
        timestamp: data.timestamp ?? new Date(),
      };
      db.signal.push(record);
      return clone(record);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.signal.length;
      db.signal.length = 0;
      return { count };
    }),
    count: vi.fn(
      async ({
        where,
      }: {
        where?: { processed?: boolean; id?: string | { in: string[] } };
      } = {}) => {
        let results = [...db.signal];
        if (where) {
          if (where.processed !== undefined)
            results = results.filter(s => s.processed === where.processed);
          const idFilter = where.id;
          if (typeof idFilter === 'string') {
            results = results.filter(s => s.id === idFilter);
          } else if (
            idFilter &&
            'in' in idFilter &&
            Array.isArray(idFilter.in)
          ) {
            results = results.filter(s => idFilter.in.includes(s.id));
          }
        }
        return results.length;
      }
    ),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<SignalRecord>;
      }) => {
        const idx = db.signal.findIndex(s => s.id === where.id);
        if (idx === -1) throw new Error('Signal not found');
        const updated = { ...db.signal[idx], ...data } as SignalRecord;
        db.signal[idx] = updated;
        return clone(updated);
      }
    ),
  };

  const alert = {
    findMany: vi.fn(async (args: { where?: { signalId?: string } } = {}) => {
      let results = [...db.alert];
      if (args.where?.signalId)
        results = results.filter(a => a.signalId === args.where?.signalId);
      return clone(results);
    }),
    create: vi.fn(async ({ data }: { data: AlertCreateInput }) => {
      const record: AlertRecord = {
        ...data,
        type: 'market',
        id: data.id ?? genId(),
        timestamp: data.timestamp ?? new Date(),
      };
      db.alert.push(record);
      return clone(record);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.alert.length;
      db.alert.length = 0;
      return { count };
    }),
  };

  const opportunity = {
    findMany: vi.fn(async (args: { where?: { signalId?: string } } = {}) => {
      let results = [...db.opportunity];
      if (args.where?.signalId)
        results = results.filter(o => o.signalId === args.where.signalId);
      return clone(results);
    }),
    create: vi.fn(async ({ data }: { data: OpportunityCreateInput }) => {
      const record: OpportunityRecord = {
        ...data,
        id: data.id ?? genId(),
        timestamp: data.timestamp ?? new Date(),
      };
      db.opportunity.push(record);
      return clone(record);
    }),
    deleteMany: vi.fn(async () => {
      const count = db.opportunity.length;
      db.opportunity.length = 0;
      return { count };
    }),
  };

  const limit = {
    findMany: vi.fn(
      async (args: { where?: { key?: { in?: string[] } } } = {}) => {
        const mockLimits: LimitRecord[] = [
          { key: 'dqp.error.threshold', value: '5' },
          { key: 'dqp.warning.threshold', value: '10' },
          { key: 'dqp.freshness.hours', value: '24' },
        ];
        let results = [...mockLimits];
        const keys = args.where?.key?.in;
        if (Array.isArray(keys)) {
          results = results.filter(l => keys.includes(l.key));
        }
        return clone(results);
      }
    ),
  };

  class PrismaClient {
    signal = signal;
    alert = alert;
    opportunity = opportunity;
    limit = limit;

    async $disconnect() {
      return Promise.resolve();
    }
    async $connect() {
      return Promise.resolve();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async $queryRaw(_query: unknown, ..._params: unknown[]) {
      return [];
    }
    async $queryRawUnsafe(query: string, ..._params: unknown[]) {
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

  const Prisma = {
    ModelName: {
      signal: 'signal',
      alert: 'alert',
      opportunity: 'opportunity',
      limit: 'limit',
    },
  } as const;

  return {
    PrismaClient,
    Prisma,
    default: PrismaClient,
  };
});

vi.mock('../src/app/api/ingest/news/route', () => ({
  POST: vi.fn(async request => {
    const data = await request.json();
    if (!data.title || !data.description) {
      return new Response(
        JSON.stringify({ success: false, error: 'validation error' }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        signalId: `mock-signal-${Date.now()}`,
        severity:
          data.title.includes('URGENT') || data.title.includes('hack')
            ? 'critical'
            : 'medium',
      }),
      { status: 201 }
    );
  }),
}));

vi.mock('../src/app/api/ingest/tvl/route', () => ({
  POST: vi.fn(async request => {
    const data = await request.json();
    if (!data.protocol || typeof data.tvl !== 'number') {
      return new Response(
        JSON.stringify({ success: false, error: 'validation error' }),
        { status: 400 }
      );
    }
    const isAlert = data.tvl < 50_000_000;
    return new Response(
      JSON.stringify({
        success: true,
        signalId: `mock-tvl-${Date.now()}`,
        alert: isAlert,
        severity: isAlert ? 'high' : 'low',
        protocol: data.protocol,
        tvl: data.tvl,
      }),
      { status: 201 }
    );
  }),
}));

vi.mock('../src/app/api/ingest/rss/route', () => ({
  POST: vi.fn(async () => {
    return new Response(
      JSON.stringify({
        processed: 5,
        signals: 3,
        duplicates: 2,
        timestamp: new Date().toISOString(),
      }),
      { status: 200 }
    );
  }),
}));

vi.mock('node-fetch', () => ({
  default: vi.fn(async url => {
    const mockResponses = {
      blockspace: {
        data: { eth_base_fee: 25, blob_base_fee: 1 },
        routes: { arbitrage: [] },
        rebates: { institutional: 0.25 },
      },
    };
    for (const key in mockResponses) {
      if (url.includes(key)) {
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponses[key]),
        };
      }
    }
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'mock', timestamp: Date.now() }),
    };
  }),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');

  const mockedUseState: typeof actual.useState = <S>(
    initialState?: S | (() => S)
  ) => {
    const value =
      typeof initialState === 'function'
        ? (initialState as () => S)()
        : initialState;
    const setter = vi.fn<Dispatch<SetStateAction<S>>>() as unknown as Dispatch<
      SetStateAction<S>
    >;
    return [value as S, setter] as [S, Dispatch<SetStateAction<S>>];
  };

  const mockedUseEffect: typeof actual.useEffect = (
    effect,
    _deps?: DependencyList
  ) => {
    effect();
  };

  const mockedUseMemo: typeof actual.useMemo = (
    factory,
    _deps?: DependencyList
  ) => factory();

  const mockedUseCallback: typeof actual.useCallback = (
    callback,
    _deps?: DependencyList
  ) => callback;

  const overrides: Pick<
    typeof actual,
    'useState' | 'useEffect' | 'useMemo' | 'useCallback'
  > = {
    useState: mockedUseState,
    useEffect: mockedUseEffect,
    useMemo: mockedUseMemo,
    useCallback: mockedUseCallback,
  };

  return { ...actual, ...overrides };
});

vi.mock('../src/store/ui', () => ({
  useNavMenuStore: vi.fn(() => ({
    isCollapsed: false,
    toggleCollapsed: vi.fn(),
  })),
  usePlan: vi.fn(() => ({ currentPlan: null, setCurrentPlan: vi.fn() })),
}));

beforeAll(async () => {
  console.log('🧪 ADAF Test Setup - Fortune 500 Mock Mode Activated');
  console.log(
    '⚠️  TODO_REPLACE_WITH_REAL_DATA: Using mock Redis, Prisma, and APIs'
  );
});

beforeEach(async () => {
  mockStorage.clear();
  vi.clearAllMocks();
});
