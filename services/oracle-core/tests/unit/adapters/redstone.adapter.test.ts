import { beforeAll, describe, expect, it } from 'vitest';

import { redstoneAdapter } from '../../../ingest/adapters/redstone.adapter';
import type { Feed } from '../../../registry/schema';
import { loadFeeds } from '../../../registry/feeds';

let btcFeed: Feed;

beforeAll(async () => {
  const feeds = await loadFeeds();
  const feed = feeds.find(entry => entry.id === 'price/btc_usd.live');
  if (!feed) {
    throw new Error('price/btc_usd.live feed not found in registry');
  }
  btcFeed = feed;
});

describe('redstone adapter', () => {
  it('returns enriched sample within heartbeat budget', async () => {
    const now = new Date('2025-10-16T14:00:12Z');
    const sample = await redstoneAdapter({
      feed: btcFeed,
      sourceId: 'redstone-btc',
      weight: 0.25,
      now,
    });

    expect(sample).toBeTruthy();
    expect(sample?.provider).toBe('redstone');
    expect(sample?.sourceId).toBe('redstone-btc');
    expect(sample?.latencyMs).toBeLessThanOrEqual(btcFeed.ttl_ms * 2);
    expect(sample?.quorumEligible).toBe(true);
    expect(sample?.metadata?.heartbeatMs).toBe(btcFeed.ttl_ms);
    expect(sample?.evidence).toHaveLength(1);
    expect(sample?.evidence[0]?.source_id).toBe('redstone-btc');
  });
});
