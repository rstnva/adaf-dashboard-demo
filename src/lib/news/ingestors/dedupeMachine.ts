import { prisma } from '../../prisma';
import { getSafeRedis } from '../../safe-redis';
import type { PipelineNewsItem } from '../types';

const REDIS_NAMESPACE = 'adaf:news-oracle:fingerprint';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h

export class NewsDedupeMachine {
  private redis = getSafeRedis();
  private ttlSeconds: number;

  constructor(ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    this.ttlSeconds = ttlSeconds;
  }

  async filterFresh(items: PipelineNewsItem[]): Promise<PipelineNewsItem[]> {
    if (!items.length) return [];

    const nowIso = new Date().toISOString();
    const fingerprints = items.map(item => item.fingerprint);

    const existing = await prisma.newsEvent.findMany({
      where: {
        fingerprint: {
          in: fingerprints,
        },
      },
      select: {
        fingerprint: true,
      },
    });

    const known = new Set(existing.map(row => row.fingerprint));

    const deduped: PipelineNewsItem[] = [];

    for (const item of items) {
      if (known.has(item.fingerprint)) {
        continue;
      }

      const redisKey = `${REDIS_NAMESPACE}:${item.fingerprint}`;

      try {
        const wasSet = await this.redis.setnx(redisKey, nowIso);
        if (!wasSet) {
          continue;
        }
        await this.redis.expire(redisKey, this.ttlSeconds);
      } catch (error) {
        console.warn('news-dedupe: redis unavailable, continuing in-memory', error);
      }

      deduped.push({
        ...item,
        stage: 'deduped',
        dedupedAt: nowIso,
      });
    }

    return deduped;
  }
}
