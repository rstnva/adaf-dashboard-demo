import { beforeAll, describe, expect, it } from 'vitest';

import { chainlinkAdapter } from '../../../ingest/adapters/chainlink.adapter';
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

describe('chainlink adapter', () => {
  it('returns enriched sample within heartbeat budget', async () => {
    const now = new Date('2025-10-16T14:00:12Z');
    const sample = await chainlinkAdapter({
      feed: btcFeed,
      sourceId: 'chainlink-btc',
      weight: 0.4,
      now,
    });

    expect(sample).toBeTruthy();
    expect(sample?.provider).toBe('chainlink');
    expect(sample?.sourceId).toBe('chainlink-btc');
    expect(sample?.evidence[0]?.round_id).toBeDefined();
    expect(sample?.evidence[0]?.block_number).toBeGreaterThan(0);
    expect(sample?.latencyMs).toBeLessThanOrEqual(btcFeed.ttl_ms * 2);
    expect(sample?.quorumEligible).toBe(true);
    expect(sample?.metadata?.heartbeatMs).toBe(btcFeed.ttl_ms);
  });
});
