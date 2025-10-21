import { beforeAll, describe, expect, it } from 'vitest';

import { chronicleUmaAdapter } from '../../../ingest/adapters/chronicle-uma.adapter';
import type { Feed } from '../../../registry/schema';
import { loadFeeds } from '../../../registry/feeds';

let ethFeed: Feed;

beforeAll(async () => {
  const feeds = await loadFeeds();
  const feed = feeds.find(entry => entry.id === 'price/eth_usd.live');
  if (!feed) {
    throw new Error('price/eth_usd.live feed not found in registry');
  }
  ethFeed = feed;
});

describe('chronicle-uma adapter', () => {
  it('returns enriched sample with dispute metadata', async () => {
    const now = new Date('2025-10-16T14:00:12Z');
    const sample = await chronicleUmaAdapter({
      feed: ethFeed,
      sourceId: 'chronicle-eth',
      weight: 0.15,
      now,
    });

    expect(sample).toBeTruthy();
    expect(sample?.provider).toMatch(/^(chronicle|uma|chronicle-uma)$/);
    expect(sample?.sourceId).toBe('chronicle-eth');
    expect(sample?.latencyMs).toBeLessThanOrEqual(ethFeed.ttl_ms * 2);
    expect(sample?.quorumEligible).toBe(true);
    expect(sample?.evidence).toHaveLength(1);
    expect(sample?.evidence[0]?.source_id).toBe('chronicle-eth');
  });
});
