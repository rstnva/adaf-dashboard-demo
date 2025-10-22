import { beforeAll, describe, expect, it } from 'vitest';

import { bandTellorAdapter } from '../../../ingest/adapters/band-tellor.adapter';
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

describe('band-tellor adapter', () => {
  it('returns enriched sample with round evidence', async () => {
    const now = new Date('2025-10-16T14:00:12Z');
    const sample = await bandTellorAdapter({
      feed: btcFeed,
      sourceId: 'band-btc',
      weight: 0.2,
      now,
    });

    expect(sample).toBeTruthy();
    expect(sample?.provider).toBe('band-tellor');
    expect(sample?.sourceId).toBe('band-btc');
    expect(sample?.latencyMs).toBeLessThanOrEqual(btcFeed.ttl_ms * 2);
    expect(sample?.quorumEligible).toBe(true);
    expect(sample?.evidence).toHaveLength(1);
    expect(sample?.evidence[0]?.source_id).toBe('band-btc');
  });
});
