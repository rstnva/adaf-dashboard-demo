import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { PrismaClient } from '@prisma/client';
import { PrismaClient as StandalonePrismaClient } from '@prisma/client';

import { loadFeeds } from './feeds';
import { FeedSchema, type Feed } from './schema';
import { getSafeRedis } from '../../../src/lib/safe-redis';

const registryRoot = path.join(process.cwd(), 'services', 'oracle-core', 'registry');
// Built-in additional files
const defaultAdditionalFiles = ['feeds.onchain.shadow.json', 'feeds.vox.json'];
// Allow passing extra feed files via CLI: `ts-node seed-feeds.ts path/to/feeds.json [more.json ...]`
const cliFeedFiles = process.argv.slice(2) ?? [];
const additionalFiles = [...defaultAdditionalFiles, ...cliFeedFiles.map((p) => path.isAbsolute(p) ? p : path.join(process.cwd(), p))];

function inferMode(feed: Feed): 'mock' | 'shadow' | 'mixed' {
  if (feed.id.includes('.live') || feed.category === 'vox') {
    return 'shadow';
  }
  return 'mock';
}

async function loadAdditionalFeeds(): Promise<Feed[]> {
  const records: Feed[] = [];

  for (const file of additionalFiles) {
    const location = path.isAbsolute(file) ? file : path.join(registryRoot, file);
    const raw = await readFile(location, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${file} must contain an array of feeds`);
    }

    parsed.forEach((entry, index) => {
      try {
        records.push(FeedSchema.parse(entry));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        throw new Error(`Invalid feed entry in ${file} at index ${index}: ${message}`);
      }
    });
  }

  return records;
}

async function seedDatabase(prisma: PrismaClient, feeds: Feed[]) {
  for (const feed of feeds) {
    const mode = inferMode(feed);
    const heartbeatMs = feed.ttl_ms;

    await prisma.feed.upsert({
      where: { id: feed.id },
      update: {
        name: feed.name,
        category: feed.category,
        unit: feed.unit,
        ttlMs: feed.ttl_ms,
        heartbeatMs,
        quorumK: feed.quorum.k,
        quorumN: feed.quorum.n,
        mode,
        tags: feed.tags,
        version: feed.version,
      },
      create: {
        id: feed.id,
        name: feed.name,
        category: feed.category,
        unit: feed.unit,
        ttlMs: feed.ttl_ms,
        heartbeatMs,
        quorumK: feed.quorum.k,
        quorumN: feed.quorum.n,
        mode,
        tags: feed.tags,
        version: feed.version,
      },
    });
  }
}

export interface SeedOracleFeedsOptions {
  prisma?: PrismaClient;
  redis?: ReturnType<typeof getSafeRedis>;
  logger?: Pick<typeof console, 'info' | 'warn' | 'error'>;
}

export async function seedOracleFeeds(options: SeedOracleFeedsOptions = {}): Promise<number> {
  const prisma = options.prisma ?? new StandalonePrismaClient();
  const redis = options.redis ?? getSafeRedis();
  const logger = options.logger ?? console;

  const shouldDisconnect = !options.prisma;

  try {
    const baseFeeds = await loadFeeds();
    const extraFeeds = await loadAdditionalFeeds();

    const feedMap = new Map<string, Feed>();
    [...baseFeeds, ...extraFeeds].forEach(feed => feedMap.set(feed.id, feed));
    const feeds = Array.from(feedMap.values());

    await seedDatabase(prisma, feeds);

    if (redis) {
      for (const feed of feeds) {
        const key = `oracle:registry:feed:${feed.id}`;
        await redis.set(key, JSON.stringify(feed));
      }
    } else {
      logger.warn?.('oracle-seed: Redis unavailable, skipping cache hydration');
    }

    logger.info?.(`Seeded ${feeds.length} oracle feeds (Postgres${redis ? ' + Redis' : ''})`);
    return feeds.length;
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

async function runCli() {
  try {
    await seedOracleFeeds();
  } catch (error) {
    console.error('Failed to seed oracle feeds', error);
    process.exit(1);
  }
}

function isExecutedFromCli(): boolean {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const invoked = pathToFileURL(process.argv[1]).href;
    return invoked === import.meta.url;
  } catch {
    return false;
  }
}

if (isExecutedFromCli()) {
  void runCli();
}
