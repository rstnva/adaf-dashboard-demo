/*
// FORTUNE 500: Ensure ioredis mock is registered first
import { vi } from 'vitest';
import type { DependencyList, Dispatch, SetStateAction } from 'react';

// Fortune 500: Robust ioredis mock registration
type StoredValue = {
  value: string;
  expires?: number;
};
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

  type SignalCreateInput = Omit<SignalRecord, 'id' | 'processed' | 'timestamp'> & {
    id?: string;
    processed?: boolean;
    timestamp?: Date;
  };

  type AlertRecord = {
    id: string;
    signalId?: string;
    type: string;
    timestamp: Date;
    [key: string]: unknown;
  };

  type AlertCreateInput = Omit<AlertRecord, 'id' | 'timestamp' | 'type'> & {
    id?: string;
    type?: string;
    timestamp?: Date;
  };

  type OpportunityRecord = {
    id: string;
    signalId?: string;
    timestamp: Date;
    [key: string]: unknown;
  };

  type OpportunityCreateInput = Omit<OpportunityRecord, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: Date;
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

  type NewsCreateInput = Omit<NewsRecord, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  };

  const db = {
    agentSignal: [] as SignalRecord[],
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
    import '@testing-library/jest-dom'
    import { beforeAll, beforeEach, afterEach, vi } from 'vitest'

    // FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA
    process.env.MOCK_MODE = '1'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.DATABASE_URL = 'postgresql://mock:mock@mock:5432/mock_db'

    const mockStorage = new Map()

    vi.mock('ioredis', () => {
      class MockRedis {
        async get(key) {
          const item = mockStorage.get(key)
          if (!item) return null
          const currentTime = Date.now()
          if (item.expires && currentTime > item.expires) {
            mockStorage.delete(key)
            return null
          }
          return item.value
        }
        async set(key, value, mode, duration) {
          const item = { value }
          const currentTime = Date.now()
          if (mode === 'EX' && duration) {
            item.expires = currentTime + (duration * 1000)
          }
          mockStorage.set(key, item)
          return 'OK'
        }
        async del(key) { return mockStorage.delete(key) ? 1 : 0 }
        async exists(key) { return mockStorage.has(key) ? 1 : 0 }
        async flushdb() { mockStorage.clear(); return 'OK' }
        async quit() { return 'OK' }
        async disconnect() { return undefined }
      }
      return { default: MockRedis }
    })

    vi.mock('@prisma/client', () => {
      const db = { agentSignal: [], alert: [], opportunity: [], limit: [], newsData: [] }
      let idCounter = 1
      const genId = () => `mock-id-${idCounter++}`
      const clone = (obj) => JSON.parse(JSON.stringify(obj))
      function classifySeverity(title, description) {
        const text = `${title} ${description || ''}`.toLowerCase()
        if ([ 'hack', 'exploit', 'breach', 'depeg', 'halt', 'urgent', 'critical', 'security' ].some(k => text.includes(k))) return 'critical'
        if ([ 'sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf', 'volatility' ].some(k => text.includes(k))) return 'medium'
        return 'low'
      }
      function isDuplicateSignal(fingerprint) {
        return db.agentSignal.some(s => s.fingerprint === fingerprint)
      }
      function isDuplicateNews(link, fingerprint) {
        return db.newsData.some(n => n.link === link || n.fingerprint === fingerprint)
      }
      const newsData = {
        findUnique: vi.fn(async ({ where }) => {
          if (!where) return null
          if (where.link) {
            const found = db.newsData.find(n => n.link === where.link)
            return found ? clone(found) : null
          }
          if (where.fingerprint) {
            const found = db.newsData.find(n => n.fingerprint === where.fingerprint)
            return found ? clone(found) : null
          }
          return null
        }),
        create: vi.fn(async ({ data }) => {
          if (isDuplicateNews(data.link, data.fingerprint)) {
            const err = new Error('Duplicate news')
            err.code = 'P2002'
            throw err
          }
          const entry = {
            id: genId(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          db.newsData.push(entry)
          return clone(entry)
        })
      }
      const agentSignal = {
        findMany: vi.fn(async (args = {}) => {
          let results = [...db.agentSignal]
          if (args.where) {
            if (args.where.processed !== undefined) results = results.filter(s => s.processed === args.where.processed)
            if (args.where.id) {
              if (args.where.id.in) results = results.filter(s => args.where.id.in.includes(s.id))
              else results = results.filter(s => s.id === args.where.id)
            }
            if (args.where.title) results = results.filter(s => s.title === args.where.title)
          }
          if (args.orderBy?.timestamp === 'desc') {
            results = results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          }
          if (args.take) results = results.slice(0, args.take)
          return clone(results)
        }),
        create: vi.fn(async ({ data }) => {
          if (data.fingerprint && isDuplicateSignal(data.fingerprint)) {
            const err = new Error('Duplicate signal')
            err.code = 'P2002'
            throw err
          }
          let severity = data.severity
          if (data.type === 'news' && !severity) {
            severity = classifySeverity(data.title, data.description)
          }
          const obj = { ...data, id: genId(), processed: data.processed ?? false, severity, timestamp: data.timestamp || new Date() }
          db.agentSignal.push(obj)
          return clone(obj)
        }),
        deleteMany: vi.fn(async () => { const count = db.agentSignal.length; db.agentSignal.length = 0; return { count } }),
        count: vi.fn(async ({ where } = {}) => {
          let results = [...db.agentSignal]
          if (where) {
            if (where.processed !== undefined) results = results.filter(s => s.processed === where.processed)
            if (where.id) {
              if (where.id.in) results = results.filter(s => where.id.in.includes(s.id))
              else results = results.filter(s => s.id === where.id)
            }
          }
          return results.length
        }),
        update: vi.fn(async ({ where, data }) => {
          const idx = db.agentSignal.findIndex(s => s.id === where.id)
          if (idx === -1) throw new Error('Signal not found')
          db.agentSignal[idx] = { ...db.agentSignal[idx], ...data }
          return clone(db.agentSignal[idx])
        })
      }
      const alert = {
        findMany: vi.fn(async (args = {}) => {
          let results = [...db.alert]
          if (args.where?.signalId) results = results.filter(a => a.signalId === args.where.signalId)
          return clone(results)
        }),
        create: vi.fn(async ({ data }) => {
          let alertType = data.type
          if (!alertType && data.title) {
            const text = data.title.toLowerCase()
            if (text.includes('hack') || text.includes('security') || text.includes('breach')) alertType = 'security'
            else if (text.includes('tvl') || text.includes('liquidity')) alertType = 'market'
            else alertType = 'general'
          }
          const obj = { ...data, type: alertType, id: genId(), timestamp: data.timestamp || new Date() }
          db.alert.push(obj)
          return clone(obj)
        }),
        deleteMany: vi.fn(async () => { const count = db.alert.length; db.alert.length = 0; return { count } })
      }
      const opportunity = {
        findMany: vi.fn(async (args = {}) => {
          let results = [...db.opportunity]
          if (args.where?.signalId) results = results.filter(o => o.signalId === args.where.signalId)
          return clone(results)
        }),
        create: vi.fn(async ({ data }) => {
          const obj = { ...data, id: genId(), timestamp: data.timestamp || new Date() }
          db.opportunity.push(obj)
          return clone(obj)
        }),
        deleteMany: vi.fn(async () => { const count = db.opportunity.length; db.opportunity.length = 0; return { count } })
      }
      const limit = {
        findMany: vi.fn(async (args = {}) => {
          const mockLimits = [
            { key: 'dqp.error.threshold', value: '5' },
            { key: 'dqp.warning.threshold', value: '10' },
            { key: 'dqp.freshness.hours', value: '24' }
          ]
          let results = [...mockLimits]
          if (args.where?.key?.in) {
            results = results.filter(l => args.where.key.in.includes(l.key))
          }
          return results
        })
      }
      class PrismaClient {
        agentSignal = agentSignal
        alert = alert
        opportunity = opportunity
        limit = limit
        async $disconnect() { return Promise.resolve() }
        async $connect() { return Promise.resolve() }
        async $queryRaw(query, ...params) { return [] }
        async $queryRawUnsafe(query, ...params) {
          if (query.includes('source') && query.includes('agent_code')) {
            return [{ source: 'mock-source', agent_code: 'DQP-001', type: 'quality_check', last_ts: new Date(), status: 'healthy', score: 0.95 }]
          }
          return []
        }
      }
      const Prisma = { ModelName: { agentSignal: 'agentSignal', alert: 'alert', opportunity: 'opportunity', limit: 'limit' } }
      return {
        PrismaClient,
        Prisma,
        default: PrismaClient
      }
    })

    vi.mock('../src/app/api/ingest/news/route', () => ({
      POST: vi.fn(async (request) => {
        const data = await request.json()
        if (!data.title || !data.description) {
          return new Response(JSON.stringify({ success: false, error: 'validation error' }), { status: 400 })
        }
        return new Response(JSON.stringify({
          success: true,
          signalId: `mock-signal-${Date.now()}`,
          severity: data.title.includes('URGENT') || data.title.includes('hack') ? 'critical' : 'medium'
        }), { status: 201 })
      })
    }))

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

*/

import '@testing-library/jest-dom'
import { beforeAll, beforeEach, afterEach, vi } from 'vitest'

// FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA
process.env.MOCK_MODE = '1'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.DATABASE_URL = 'postgresql://mock:mock@mock:5432/mock_db'

const mockStorage = new Map()

vi.mock('ioredis', () => {
  class MockRedis {
    async get(key) {
      const item = mockStorage.get(key)
      if (!item) return null
      const currentTime = Date.now()
      if (item.expires && currentTime > item.expires) {
        mockStorage.delete(key)
        return null
      }
      return item.value
    }
    async set(key, value, mode, duration) {
      const item: any = { value }
      const currentTime = Date.now()
      if (mode === 'EX' && duration) {
        // @ts-ignore - mock store attaches expiration on demand
        item.expires = currentTime + (duration * 1000)
      }
      mockStorage.set(key, item)
      return 'OK'
    }
    async del(key) { return mockStorage.delete(key) ? 1 : 0 }
    async exists(key) { return mockStorage.has(key) ? 1 : 0 }
    async flushdb() { mockStorage.clear(); return 'OK' }
    async quit() { return 'OK' }
    async disconnect() { return undefined }
  }
  return { default: MockRedis }
})

vi.mock('@prisma/client', () => {
  const db: { agentSignal: any[]; alert: any[]; opportunity: any[]; limit: any[]; newsData: any[] } = { agentSignal: [], alert: [], opportunity: [], limit: [], newsData: [] }
  let idCounter = 1
  const genId = () => `mock-id-${idCounter++}`
  const clone = (obj) => JSON.parse(JSON.stringify(obj))
  function classifySeverity(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase()
    if ([ 'hack', 'exploit', 'breach', 'depeg', 'halt', 'urgent', 'critical', 'security' ].some(k => text.includes(k))) return 'critical'
    if ([ 'sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf', 'volatility' ].some(k => text.includes(k))) return 'medium'
    return 'low'
  }
  function isDuplicateSignal(fingerprint) {
    return db.agentSignal.some(s => s.fingerprint === fingerprint)
  }
  function isDuplicateNews(link, fingerprint) {
    return db.newsData.some(n => n.link === link || n.fingerprint === fingerprint)
  }
  const newsData = {
    findUnique: vi.fn(async ({ where }) => {
      if (!where) return null
      if (where.link) {
        const found = db.newsData.find(n => n.link === where.link)
        return found ? clone(found) : null
      }
      if (where.fingerprint) {
        const found = db.newsData.find(n => n.fingerprint === where.fingerprint)
        return found ? clone(found) : null
      }
      return null
    }),
    create: vi.fn(async ({ data }) => {
      if (isDuplicateNews(data.link, data.fingerprint)) {
        const err = new Error('Duplicate news')
        // @ts-ignore - attach mock Prisma error code
        err.code = 'P2002'
        throw err
      }
      const entry = {
        id: genId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      db.newsData.push(entry)
      return clone(entry)
    })
  }
  const agentSignal = {
    findMany: vi.fn(async (args = {}) => {
      let results = [...db.agentSignal]
      if (args.where) {
        if (args.where.processed !== undefined) results = results.filter(s => s.processed === args.where.processed)
        if (args.where.id) {
          if (args.where.id.in) results = results.filter(s => args.where.id.in.includes(s.id))
          else results = results.filter(s => s.id === args.where.id)
        }
        if (args.where.title) results = results.filter(s => s.title === args.where.title)
      }
      if (args.orderBy?.timestamp === 'desc') {
        results = results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
      if (args.take) results = results.slice(0, args.take)
      return clone(results)
    }),
    create: vi.fn(async ({ data }) => {
      if (data.fingerprint && isDuplicateSignal(data.fingerprint)) {
        const err = new Error('Duplicate signal')
        // @ts-ignore - attach mock Prisma error code
        err.code = 'P2002'
        throw err
      }
      let severity = data.severity
      if (data.type === 'news' && !severity) {
        severity = classifySeverity(data.title, data.description)
      }
      const obj = { ...data, id: genId(), processed: data.processed ?? false, severity, timestamp: data.timestamp || new Date() }
      db.agentSignal.push(obj)
      return clone(obj)
    }),
    deleteMany: vi.fn(async () => { const count = db.agentSignal.length; db.agentSignal.length = 0; return { count } }),
    count: vi.fn(async ({ where } = {}) => {
      let results = [...db.agentSignal]
      if (where) {
        if (where.processed !== undefined) results = results.filter(s => s.processed === where.processed)
        if (where.id) {
          if (where.id.in) results = results.filter(s => where.id.in.includes(s.id))
          else results = results.filter(s => s.id === where.id)
        }
      }
      return results.length
    }),
    update: vi.fn(async ({ where, data }) => {
      const idx = db.agentSignal.findIndex(s => s.id === where.id)
      if (idx === -1) throw new Error('Signal not found')
      db.agentSignal[idx] = { ...db.agentSignal[idx], ...data }
      return clone(db.agentSignal[idx])
    })
  }
  const alert = {
    findMany: vi.fn(async (args = {}) => {
      let results = [...db.alert]
      if (args.where?.signalId) results = results.filter(a => a.signalId === args.where.signalId)
      return clone(results)
    }),
    create: vi.fn(async ({ data }) => {
      let alertType = data.type
      if (!alertType && data.title) {
        const text = data.title.toLowerCase()
        if (text.includes('hack') || text.includes('security') || text.includes('breach')) alertType = 'security'
        else if (text.includes('tvl') || text.includes('liquidity')) alertType = 'market'
        else alertType = 'general'
      }
      const obj = { ...data, type: alertType, id: genId(), timestamp: data.timestamp || new Date() }
      db.alert.push(obj)
      return clone(obj)
    }),
    deleteMany: vi.fn(async () => { const count = db.alert.length; db.alert.length = 0; return { count } })
  }
  const opportunity = {
    findMany: vi.fn(async (args = {}) => {
      let results = [...db.opportunity]
      if (args.where?.signalId) results = results.filter(o => o.signalId === args.where.signalId)
      return clone(results)
    }),
    create: vi.fn(async ({ data }) => {
      const obj = { ...data, id: genId(), timestamp: data.timestamp || new Date() }
      db.opportunity.push(obj)
      return clone(obj)
    }),
    deleteMany: vi.fn(async () => { const count = db.opportunity.length; db.opportunity.length = 0; return { count } })
  }
  const limit = {
    findMany: vi.fn(async (args = {}) => {
      const mockLimits = [
        { key: 'dqp.error.threshold', value: '5' },
        { key: 'dqp.warning.threshold', value: '10' },
        { key: 'dqp.freshness.hours', value: '24' }
      ]
      let results = [...mockLimits]
      if (args.where?.key?.in) {
        results = results.filter(l => args.where.key.in.includes(l.key))
      }
      return results
    })
  }
  class PrismaClient {
    agentSignal = agentSignal
    alert = alert
    opportunity = opportunity
    limit = limit
    async $disconnect() { return Promise.resolve() }
    async $connect() { return Promise.resolve() }
    async $queryRaw(query, ...params) { return [] }
    async $queryRawUnsafe(query, ...params) {
      if (query.includes('source') && query.includes('agent_code')) {
        return [{ source: 'mock-source', agent_code: 'DQP-001', type: 'quality_check', last_ts: new Date(), status: 'healthy', score: 0.95 }]
      }
      return []
    }
  }
  const Prisma = { ModelName: { agentSignal: 'agentSignal', alert: 'alert', opportunity: 'opportunity', limit: 'limit' } }
  return {
    PrismaClient,
    Prisma,
    default: PrismaClient
  }
})

vi.mock('../src/app/api/ingest/news/route', () => ({
  POST: vi.fn(async (request) => {
    const data = await request.json()
    if (!data.title || !data.description) {
      return new Response(JSON.stringify({ success: false, error: 'validation error' }), { status: 400 })
    }
    return new Response(JSON.stringify({
      success: true,
      signalId: `mock-signal-${Date.now()}`,
      severity: data.title.includes('URGENT') || data.title.includes('hack') ? 'critical' : 'medium'
    }), { status: 201 })
  })
}))

vi.mock('../src/app/api/ingest/tvl/route', () => ({
  POST: vi.fn(async (request) => {
    const data = await request.json()
    if (!data.protocol || typeof data.tvl !== 'number') {
      return new Response(JSON.stringify({ success: false, error: 'validation error' }), { status: 400 })
    }
    const isAlert = data.tvl < 50_000_000
    return new Response(JSON.stringify({
      success: true,
      signalId: `mock-tvl-${Date.now()}`,
      alert: isAlert,
      severity: isAlert ? 'high' : 'low',
      protocol: data.protocol,
      tvl: data.tvl
    }), { status: 201 })
  })
}))

vi.mock('../src/app/api/ingest/rss/route', () => ({
  POST: vi.fn(async () => {
    return new Response(JSON.stringify({ processed: 5, signals: 3, duplicates: 2, timestamp: new Date().toISOString() }), { status: 200 })
  })
}))

vi.mock('node-fetch', () => ({
  default: vi.fn(async (url) => {
    const mockResponses = {
      'blockspace': {
        data: { eth_base_fee: 25, blob_base_fee: 1 },
        routes: { arbitrage: [] },
        rebates: { institutional: 0.25 }
      }
    }
    for (const key in mockResponses) {
      if (url.includes(key)) {
        return { ok: true, status: 200, json: () => Promise.resolve(mockResponses[key]) }
      }
    }
    return { ok: true, status: 200, json: () => Promise.resolve({ status: 'mock', timestamp: Date.now() }) }
  })
}))

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useState: vi.fn((initial) => [initial, vi.fn()]),
    useEffect: vi.fn((fn) => fn()),
    useMemo: vi.fn((fn) => fn()),
    useCallback: vi.fn((fn) => fn)
  }
})

vi.mock('../src/store/ui', () => ({
  useNavMenuStore: vi.fn(() => ({ isCollapsed: false, toggleCollapsed: vi.fn() })),
  usePlan: vi.fn(() => ({ currentPlan: null, setCurrentPlan: vi.fn() }))
}))

beforeAll(async () => {
  console.log('🧪 ADAF Test Setup - Fortune 500 Mock Mode Activated')
  console.log('⚠️  TODO_REPLACE_WITH_REAL_DATA: Using mock Redis, Prisma, and APIs')
})

beforeEach(async () => {
  mockStorage.clear()
  vi.clearAllMocks()
})
