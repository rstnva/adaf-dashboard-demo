import { readFile } from 'node:fs/promises';

import { loadFeeds } from '../registry/feeds';
import { getFeedBaseline } from '../registry/feed-baseline';
import type { Feed, Signal } from '../registry/schema';
import { createMockEvidence } from '../lineage/evidence';
import type { RawSample } from '../pipeline';

interface GeneratorOptions {
  seed: number;
  timestamp?: Date;
  filter?: (_feed: Feed) => boolean;
}

const fixtureCache: Record<string, Signal[] | null> = {};

async function loadFixture(category: string): Promise<Signal[]> {
  if (fixtureCache[category]) {
    return fixtureCache[category] ?? [];
  }

  try {
    const fileUrl = new URL(`./fixtures/${category}/default.json`, import.meta.url);
    const raw = await readFile(fileUrl, 'utf-8');
    const parsed = JSON.parse(raw) as Signal[];
    fixtureCache[category] = parsed;
    return parsed;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      console.warn(`oracle-mock: failed to load fixture for ${category}`, err);
    }
    fixtureCache[category] = [];
    return [];
  }
}

async function findFixtureForFeed(feed: Feed): Promise<Signal | undefined> {
  const fixtures = await loadFixture(feed.category);
  return fixtures.find(signal => signal.feedId === feed.id);
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashToSeed(feedId: string, seed: number): number {
  let hash = seed;
  for (const char of feedId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }
  return hash;
}

export async function generateMockSamples(options: GeneratorOptions): Promise<Array<{ feed: Feed; samples: RawSample[] }>> {
  const feeds = await loadFeeds();
  const selected = feeds.filter(feed => (options.filter ? options.filter(feed) : true));

  const entries = await Promise.all(
    selected.map(async feed => {
      const fixture = await findFixtureForFeed(feed);
      if (fixture) {
        const signal: RawSample = {
          value: fixture.value,
          weight: 1,
          evidence: fixture.evidence?.length ? fixture.evidence : [createMockEvidence('mock')],
          confidence: fixture.confidence ?? 0.7,
        };

        return {
          feed,
          samples: [signal],
        };
      }

      const feedSeed = hashToSeed(feed.id, options.seed);
      const random = mulberry32(feedSeed);
  const { base, amplitude } = getFeedBaseline(feed);
      const value = base + (random() - 0.5) * 2 * amplitude;
      const confidence = 0.6 + random() * 0.2;

      const signal: RawSample = {
        value,
        weight: 1,
        evidence: [createMockEvidence('mock')],
        confidence,
      };

      return {
        feed,
        samples: [signal],
      };
    })
  );

  return entries;
}

export async function generateSignals(options: GeneratorOptions): Promise<Signal[]> {
  const entries = await generateMockSamples(options);

  const signals = await Promise.all(
    entries.map(async entry => {
      const fixture = await findFixtureForFeed(entry.feed);
      if (fixture) {
        return {
          ...fixture,
          id: fixture.id ?? `${entry.feed.id}:${options.seed}`,
          feedId: entry.feed.id,
          ts: fixture.ts ?? (options.timestamp ?? new Date()).toISOString(),
          tags: fixture.tags?.length ? fixture.tags : entry.feed.tags ?? [],
        } satisfies Signal;
      }

      return {
        id: `${entry.feed.id}:${options.seed}`,
        feedId: entry.feed.id,
        ts: (options.timestamp ?? new Date()).toISOString(),
        value: entry.samples[0]?.value ?? 0,
        unit: entry.feed.unit,
        confidence: entry.samples[0]?.confidence ?? 0.7,
        quorum_ok: true,
        stale: false,
        evidence: entry.samples[0]?.evidence ?? [],
        tags: entry.feed.tags ?? [],
        rev: 0,
      } satisfies Signal;
    })
  );

  return signals;
}
