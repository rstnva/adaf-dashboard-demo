import { redisClient } from '../cache/redisClient';

// In-memory fallback store (per-process)
const mem: Record<string, { value: any; exp: number }> = {};

const TTL_STATS_SEC = 24 * 60 * 60; // 24h

const logDevError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(message, error);
  }
};

export async function readStats<T = any>(key: string): Promise<T | null> {
  try {
    const s = await redisClient.get(key);
    if (s) return JSON.parse(s) as T;
  } catch (error) {
    logDevError('Failed to read stats from Redis', error);
  }
  const m = mem[key];
  if (m && m.exp > Date.now()) return m.value as T;
  return null;
}

export async function writeStats<T = any>(key: string, obj: T): Promise<void> {
  const str = JSON.stringify(obj);
  try {
    await redisClient.set(key, str, TTL_STATS_SEC);
  } catch (error) {
    logDevError('Failed to write stats to Redis', error);
  }
  mem[key] = { value: obj, exp: Date.now() + TTL_STATS_SEC * 1000 };
}

export const NORM_KEYS = {
  vix: 'wsp:norm:vix:stats',
  dxy: 'wsp:norm:dxy:stats',
  etfBtc: 'wsp:norm:etf:btc:p5p95',
  etfEth: 'wsp:norm:etf:eth:p5p95',
} as const;

export async function readPctl<T = any>(key: string): Promise<T | null> {
  try {
    const s = await redisClient.get(key);
    if (s) return JSON.parse(s) as T;
  } catch (error) {
    logDevError('Failed to read percentiles from Redis', error);
  }
  const m = mem[key];
  if (m && m.exp > Date.now()) return m.value as T;
  return null;
}

export async function writePctl<T = any>(key: string, obj: T): Promise<void> {
  const str = JSON.stringify(obj);
  try {
    await redisClient.set(key, str, TTL_STATS_SEC);
  } catch (error) {
    logDevError('Failed to write percentiles to Redis', error);
  }
  mem[key] = { value: obj, exp: Date.now() + TTL_STATS_SEC * 1000 };
}
