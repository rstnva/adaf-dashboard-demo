import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { NewsRSSIngestor } from '@/lib/news/ingestors/rssIngestor';
import { NewsDedupeMachine } from '@/lib/news/ingestors/dedupeMachine';
import { NewsRSSAdapter, type NewsItem } from '@/lib/ingest/adapters/news-rss';
import { runNewsOracle } from '@/lib/news/orchestrator/orchestrator';
import type { PipelineNewsItem } from '@/lib/news/types';

function resetDb() {
  const store = (globalThis as any).__TEST_MOCKS__?.db;
  if (!store) return;
  for (const key of Object.keys(store)) {
    if (Array.isArray(store[key])) {
      store[key].length = 0;
    }
  }
}

const criticalNews: NewsItem = {
  source: 'coindesk',
  title: 'Major protocol hack drains liquidity pools',
  url: 'https://example.com/hack',
  published_at: new Date().toISOString(),
  summary: 'A severe hack triggered emergency shutdowns across DeFi venues.',
  category: 'security',
  tickers: ['ETH'],
  keywords: ['hack', 'exploit'],
};

const positiveNews: NewsItem = {
  source: 'theblock',
  title: 'Institutional adoption surges as ETF flows hit records',
  url: 'https://example.com/etf',
  published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  summary: 'Record-breaking ETF inflows spark bullish sentiment across markets.',
  category: 'institutional',
  tickers: ['BTC'],
  keywords: ['surge', 'etf'],
};

describe('News Oracle pipeline', () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('NewsRSSIngestor enriches items with fingerprint and priority', async () => {
    vi.spyOn(NewsRSSAdapter.prototype, 'pullFeed').mockResolvedValue([
      criticalNews,
    ]);

    const ingestor = new NewsRSSIngestor({
      feeds: [{ url: 'https://mock-feed', source: 'coindesk' }],
      maxItems: 5,
    });

    const items = await ingestor.collect();
    expect(items).toHaveLength(1);
    expect(items[0].fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(items[0].priority).toBe('high');
    expect(items[0].stage).toBe('ingested');
  });

  it('NewsDedupeMachine filters known fingerprints', async () => {
    const store = (globalThis as any).__TEST_MOCKS__.db;
    store.newsEvent.push({
      id: 'existing',
      fingerprint: 'fp-duplicate',
      source: 'coindesk',
      title: 'Existing event',
      url: 'https://duplicate',
      summary: 'duplicate',
      category: 'security',
      publishedAt: new Date().toISOString(),
      tickers: ['ETH'],
      keywords: ['hack'],
      status: 'deduped',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const machine = new NewsDedupeMachine();
    const items: PipelineNewsItem[] = [
      {
        ...criticalNews,
        fingerprint: 'fp-duplicate',
        priority: 'high',
        stage: 'ingested',
      },
      {
        ...criticalNews,
        url: 'https://unique',
        fingerprint: 'fp-unique',
        priority: 'high',
        stage: 'ingested',
      },
    ];

    const deduped = await machine.filterFresh(items);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].fingerprint).toBe('fp-unique');
    expect(deduped[0].stage).toBe('deduped');
  });

  it('runNewsOracle executes ingestion → standby → triage pipeline', async () => {
    vi.spyOn(NewsRSSAdapter.prototype, 'pullFeed').mockResolvedValueOnce([
      criticalNews,
      positiveNews,
    ]);

    const result = await runNewsOracle({
      feeds: [{ url: 'https://mock-feed', source: 'coindesk' }],
      maxItems: 10,
    });

    expect(result.ingested).toBeGreaterThanOrEqual(2);
    expect(result.deduped).toBeGreaterThan(0);
    expect(result.standby).toBeGreaterThan(0);

    const store = (globalThis as any).__TEST_MOCKS__.db;
    expect(store.newsAnalysis.length).toBeGreaterThan(0);
    expect(store.newsTriage.length).toBeGreaterThan(0);

    const escalated = store.newsAnalysis.filter(
      (analysis: any) => analysis.status === 'escalated'
    );
    expect(escalated.length).toBeGreaterThanOrEqual(1);

    const alerts = store.alert.filter((alert: any) => alert.type === 'news');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });
});
