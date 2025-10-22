import { createHash } from 'crypto';
import { NewsRSSAdapter } from '../../ingest/adapters/news-rss';
import {
  DEFAULT_NEWS_PIPELINE_CONFIG,
  NEWS_PRIORITY_KEYWORDS,
  NEWS_PRIORITY_TICKERS,
} from '../config';
import type { PipelineConfig, PipelineNewsItem } from '../types';

export class NewsRSSIngestor {
  private adapter: NewsRSSAdapter;
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.adapter = new NewsRSSAdapter();
    this.config = {
      ...DEFAULT_NEWS_PIPELINE_CONFIG,
      ...config,
    };
  }

  async collect(): Promise<PipelineNewsItem[]> {
    const aggregated: PipelineNewsItem[] = [];

    for (const feed of this.config.feeds) {
      try {
        const items = await this.adapter.pullFeed(feed.url, feed.source);
        for (const item of items) {
          const fingerprint = this.computeFingerprint(feed.source, item.url, item.title);
          const priority = this.computePriority(item.tickers, item.keywords, item.summary);

          aggregated.push({
            ...item,
            fingerprint,
            priority,
            category: item.category,
            stage: 'ingested',
          });
        }
      } catch (error) {
        console.error(`news-ingestor: failed feed ${feed.source}`, error);
      }
    }

    // Sort by published date desc and limit
    aggregated.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    return aggregated.slice(0, this.config.maxItems);
  }

  private computeFingerprint(source: string, url: string, title: string): string {
    const hash = createHash('sha256');
    hash.update(`${source}|${url}|${title}`);
    return hash.digest('hex');
  }

  private computePriority(
    tickers: string[],
    keywords: string[],
    summary?: string
  ): PipelineNewsItem['priority'] {
    const keywordPriority = keywords.reduce<PipelineNewsItem['priority']>((acc, keyword) => {
      const mapped = NEWS_PRIORITY_KEYWORDS[keyword.toLowerCase()];
      if (!mapped) return acc;
      if (mapped === 'high') return 'high';
      if (mapped === 'medium' && acc === 'normal') return 'medium';
      return acc;
    }, 'normal');

    const tickerPriority = tickers.reduce<PipelineNewsItem['priority']>((acc, ticker) => {
      const mapped = NEWS_PRIORITY_TICKERS[ticker.toUpperCase()];
      if (!mapped) return acc;
      if (mapped === 'high') return 'high';
      if (mapped === 'medium' && acc === 'normal') return 'medium';
      return acc;
    }, 'normal');

    let summaryPriority: PipelineNewsItem['priority'] = 'normal';
    if (summary) {
      const lower = summary.toLowerCase();
      if (lower.includes('breaking') || lower.includes('emergency')) {
        summaryPriority = 'high';
      } else if (lower.includes('warning') || lower.includes('alert')) {
        summaryPriority = 'medium';
      }
    }

    return [keywordPriority, tickerPriority, summaryPriority].reduce(
      (acc, value) => (value === 'high' ? 'high' : value === 'medium' && acc === 'normal' ? 'medium' : acc),
      'normal' as PipelineNewsItem['priority']
    );
  }
}
