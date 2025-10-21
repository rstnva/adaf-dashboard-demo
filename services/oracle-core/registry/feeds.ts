import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Feed, FeedSchema } from './schema';

let cachedFeeds: Feed[] | null = null;

const REGISTRY_ROOT = path.join(process.cwd(), 'services', 'oracle-core', 'registry');
const FEED_FILES = ['feeds.mock.json', 'feeds.onchain.shadow.json', 'feeds.vox.json'];

async function loadFeedFile(fileName: string): Promise<Feed[]> {
  const location = path.join(REGISTRY_ROOT, fileName);
  const raw = await readFile(location, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must be an array`);
  }

  return parsed.map((entry, index) => {
    try {
      return FeedSchema.parse(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Invalid feed definition in ${fileName} at index ${index}: ${message}`);
    }
  });
}

export async function loadFeeds(): Promise<Feed[]> {
  if (cachedFeeds) {
    return cachedFeeds;
  }

  const feedsById = new Map<string, Feed>();
  for (const file of FEED_FILES) {
    const feeds = await loadFeedFile(file);
    feeds.forEach(feed => {
      feedsById.set(feed.id, feed);
    });
  }

  cachedFeeds = Array.from(feedsById.values());
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
