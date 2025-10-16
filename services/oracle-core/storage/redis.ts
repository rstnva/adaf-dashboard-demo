import { getSafeRedis } from '../../../src/lib/safe-redis';

const redis = getSafeRedis();

export async function cacheSignal<T>(key: string, payload: T, ttlSeconds = 30) {
  if (!redis) return;
  if (typeof (redis as any).setex === 'function') {
    await (redis as any).setex(key, ttlSeconds, JSON.stringify(payload));
    return;
  }

  await redis.set(key, JSON.stringify(payload));
  if (typeof (redis as any).expire === 'function') {
    await (redis as any).expire(key, ttlSeconds);
  }
}

export async function getCachedSignal<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
}
