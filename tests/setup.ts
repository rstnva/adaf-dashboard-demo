import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

  // In-memory DB for each model
  const db = {
    signal: [],
    alert: [],
    opportunity: []
  }
  let idCounter = 1
  function genId() { return idCounter++ }
  const clone = obj => JSON.parse(JSON.stringify(obj))

  // Helper: classify severity for news
  function classifySeverity(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase()
    if (['hack', 'exploit', 'breach', 'depeg', 'halt'].some(k => text.includes(k))) return 'critical'
    if (['sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf'].some(k => text.includes(k))) return 'medium'
    return 'low'
  }

  // Helper: deduplication by fingerprint
  function isDuplicateSignal(fingerprint) {
    return db.signal.some(s => s.fingerprint === fingerprint)
  }

  // Model mocks with business logic
  const signal = {
    findMany: vi.fn(async (args = {}) => {
      let results = db.signal
      if (args.where) {
        if (args.where.processed !== undefined) results = results.filter(s => s.processed === args.where.processed)
        if (args.where.id) {
          if (args.where.id.in) results = results.filter(s => args.where.id.in.includes(s.id))
          else results = results.filter(s => s.id === args.where.id)
        }
        if (args.where.title) results = results.filter(s => s.title === args.where.title)
      }
  if (args.orderBy && args.orderBy.timestamp === 'desc') results = [...results].sort((a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime())
      if (args.take) results = results.slice(0, args.take)
      return clone(results)
    }),
    create: vi.fn(async ({ data }) => {
      // Deduplication
      if (data.fingerprint && isDuplicateSignal(data.fingerprint)) {
        const err = new Error('Duplicate signal')
        // @ts-ignore
        err.code = 'P2002'
        throw err
      }
      // Severity classification for news
      let severity = data.severity
      if (data.type === 'news' && (!severity || severity === 'low')) {
        severity = classifySeverity(data.title, data.description)
      }
      // Auto-create alert for critical news or TVL drop
      const obj = { ...data, id: genId(), processed: data.processed ?? false, severity }
      db.signal.push(obj)
      return clone(obj)
    }),
    deleteMany: vi.fn(async () => { db.signal = []; return { count: 0 } }),
    update: vi.fn(async ({ where, data }) => {
      const idx = db.signal.findIndex(s => s.id === where.id)
      if (idx === -1) throw new Error('Not found')
      db.signal[idx] = { ...db.signal[idx], ...data }
      return clone(db.signal[idx])
    })
  }

const alert = {
  findMany: vi.fn(async (args = {}) => {
    let results = db.alert
    if (args.where && args.where.signalId) results = results.filter(a => a.signalId === args.where.signalId)
    return clone(results)
  }),
  create: vi.fn(async ({ data }) => {
    const obj = { ...data, id: genId() }
    db.alert.push(obj)
    return clone(obj)
  }),
  deleteMany: vi.fn(async () => { db.alert = []; return { count: 0 } })
}

const opportunity = {
  findMany: vi.fn(async (args = {}) => {
    let results = db.opportunity
    if (args.where && args.where.signalId) results = results.filter(o => o.signalId === args.where.signalId)
    return clone(results)
  }),
  create: vi.fn(async ({ data }) => {
    const obj = { ...data, id: genId() }
    db.opportunity.push(obj)
    return clone(obj)
  }),
  deleteMany: vi.fn(async () => { db.opportunity = []; return { count: 0 } })
}

vi.mock('@prisma/client', () => {
  class PrismaClient {
    signal = signal
    alert = alert
    opportunity = opportunity
    $disconnect = vi.fn(async () => {})
  }
  return { PrismaClient }
});