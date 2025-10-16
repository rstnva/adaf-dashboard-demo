import { PipelineConfig } from './types';

export const DEFAULT_NEWS_PIPELINE_CONFIG: PipelineConfig = {
  feeds: [
    {
      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
      source: 'coindesk',
    },
    {
      url: 'https://www.theblock.co/rss',
      source: 'theblock',
    },
    {
      url: 'https://blog.chainalysis.com/rss/',
      source: 'chainalysis',
    },
    {
      url: 'https://rsshub.app/reuters/worldNews',
      source: 'reuters',
    },
  ],
  standbyMinutes: 45,
  maxItems: 100,
};

export const NEWS_PRIORITY_KEYWORDS: Record<string, 'medium' | 'high'> = {
  hack: 'high',
  exploit: 'high',
  breach: 'high',
  regulation: 'medium',
  lawsuit: 'medium',
  approval: 'medium',
  rejection: 'medium',
};

export const NEWS_PRIORITY_TICKERS: Record<string, 'medium' | 'high'> = {
  BTC: 'high',
  ETH: 'high',
  SOL: 'medium',
  ETHFI: 'medium',
};
