#!/usr/bin/env ts-node
import process from 'node:process';

import { loadFeeds } from './feeds';
import { getSafeRedis } from '../../../src/lib/safe-redis';

async function main() {
  const redis = getSafeRedis();
  const feeds = await loadFeeds();

  for (const feed of feeds) {
    const key = `oracle:registry:feed:${feed.id}`;
    await redis.set(key, JSON.stringify(feed));
  }

  console.info(`Seeded ${feeds.length} oracle feeds into Redis registry`);
}

main().catch(error => {
  console.error('Failed to seed oracle feeds', error);
  process.exit(1);
});
