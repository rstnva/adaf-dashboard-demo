// Safe Redis wrapper that avoids top-level connections and falls back to in-memory.
// Use to prevent build-time EAI_AGAIN logs and allow MOCK_MODE in CI.
import type { Redis, RedisOptions } from 'ioredis'

type RedisLike = {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<'OK' | null>
  setex(key: string, ttl: number, value: string): Promise<'OK' | null>
  setnx: (key: string, value: string) => Promise<boolean>
  del: (...keys: string[]) => Promise<number>
  ttl: (key: string) => Promise<number>
  mget: (...keys: string[]) => Promise<(string | null)[]>
  smembers: (key: string) => Promise<string[]>
  sadd: (key: string, member: string) => Promise<number>
  expire: (key: string, ttl: number) => Promise<number>
  keys: (pattern: string) => Promise<string[]>
  scan: (cursor: string, match: string, pattern: string, countLabel: string, count: number) => Promise<[string, string[]]>
  pipeline: () => {
    setex: (key: string, ttl: number, value: string) => any
    set: (key: string, value: string) => any
    sadd: (key: string, value: string) => any
    expire: (key: string, ttl: number) => any
    exec: () => Promise<any>
  }
  publish?: (channel: string, message: string) => Promise<number>
  psubscribe?: (pattern: string) => Promise<number>
  on?: (event: string, cb: (...args: any[]) => void) => void
  ping?: () => Promise<string>
  info?: (section?: string) => Promise<string>
  dbsize?: () => Promise<number>
}

const isMock = () => process.env.MOCK_MODE === '1' || process.env.NODE_ENV === 'test'

// Very small in-memory store with TTLs
const mem = new Map<string, { v: string; exp: number }>()

function now() { return Date.now() }

const memClient: RedisLike = {
  async setnx(key, value) {
    if (mem.has(key)) return false;
    mem.set(key, { v: value, exp: now() + 24 * 3600 * 1000 });
    return true;
  },
  async get(key) {
    const e = mem.get(key)
    if (!e) return null
    if (now() > e.exp) { mem.delete(key); return null }
    return e.v
  },
  async set(key, value) { mem.set(key, { v: value, exp: now() + 24 * 3600 * 1000 }); return 'OK' },
  async setex(key, ttl, value) { mem.set(key, { v: value, exp: now() + ttl * 1000 }); return 'OK' },
  async del(...keys) { let c = 0; keys.forEach(k => { if (mem.delete(k)) c++ }); return c },
  async ttl(key) { const e = mem.get(key); if (!e) return -2; return Math.max(0, Math.floor((e.exp - now()) / 1000)) },
  async mget(...keys) { return keys.map(k => { const e = mem.get(k); if (!e) return null; if (now() > e.exp) { mem.delete(k); return null } return e.v }) },
  async smembers(_key) { return [] },
  async sadd(_key, _member) { return 1 },
  async expire(key, ttl) { const e = mem.get(key); if (!e) return 0; mem.set(key, { v: e.v, exp: now() + ttl * 1000 }); return 1 },
  async keys(pattern) { const re = new RegExp('^' + pattern.replace('*', '.*') + '$'); return Array.from(mem.keys()).filter(k => re.test(k)) },
  async scan(cursor, _match, pattern, _countLabel, count) {
    const all = await this.keys(pattern)
    const start = parseInt(cursor, 10) || 0
    const slice = all.slice(start, start + count)
    const next = start + count >= all.length ? '0' : String(start + count)
    return [next, slice]
  },
  pipeline() {
    const ops: Array<() => void> = []
    return {
      setex: (k, t, v) => { ops.push(() => { mem.set(k, { v, exp: now() + t * 1000 }) }); return this },
      set: (k, v) => { ops.push(() => { mem.set(k, { v, exp: now() + 24 * 3600 * 1000 }) }); return this },
      sadd: (_k, _v) => { return this },
      expire: (k, t) => { ops.push(() => { const e = mem.get(k); if (e) mem.set(k, { v: e.v, exp: now() + t * 1000 }) }); return this },
      async exec() { ops.forEach(fn => fn()) }
    }
  },
  async ping() { return 'PONG' },
  async info(_section?: string) { return '' },
  async dbsize() { return mem.size }
}

let cached: RedisLike | null = null

export function getSafeRedis(opts?: RedisOptions): RedisLike {
  if (cached) return cached

  // Avoid connecting during build or when MOCK_MODE=1
  if (isMock() || process.env.NEXT_RUNTIME === 'edge') {
    cached = memClient
    return cached
  }

  try {
    // Lazy import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: IORedis } = require('ioredis') as { default: new (o?: RedisOptions | string) => Redis }
    const url = process.env.REDIS_URL
    const redis: any = url ? new IORedis(url) : new IORedis(opts as any)
    // Graceful event listeners (no throws)
    redis.on?.('error', (e: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('safe-redis: error', e?.message)
      }
    })
    redis.on?.('connect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.info('safe-redis: connected')
      }
    })
    cached = redis as RedisLike
    return cached
  } catch (e) {
    // Fallback to memory if ioredis not available or fails to init
    cached = memClient
    return cached
  }
}

export function getMemoryRedis(): RedisLike { return memClient }
