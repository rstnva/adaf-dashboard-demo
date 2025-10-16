import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Feed, FeedSchema } from './schema';

let cachedFeeds: Feed[] | null = null;

const FEEDS_FILE = path.join(
  process.cwd(),
  'services',
  'oracle-core',
  'registry',
  'feeds.mock.json'
);

export async function loadFeeds(): Promise<Feed[]> {
  if (cachedFeeds) {
    return cachedFeeds;
  }

  const raw = await readFile(FEEDS_FILE, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('feeds.mock.json must be an array');
  }

  cachedFeeds = parsed.map((entry, index) => {
    try {
      return FeedSchema.parse(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Invalid feed definition at index ${index}: ${message}`);
    }
  });

  return cachedFeeds;
}

export function clearFeedsCache() {
  cachedFeeds = null;
}

export async function getFeedById(feedId: string): Promise<Feed | undefined> {
  const feeds = await loadFeeds();
  return feeds.find(feed => feed.id === feedId);
}

export async function listFeedsByCategory(category?: string): Promise<Feed[]> {
  const feeds = await loadFeeds();
  if (!category) {
    return feeds;
  }
  return feeds.filter(feed => feed.category === category);
}
