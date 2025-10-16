import type { NewsItem } from '../ingest/adapters/news-rss';

export type NewsPipelineStage =
  | 'ingested'
  | 'deduped'
  | 'standby'
  | 'triaged';

export type NewsRiskLevel = 'low' | 'moderate' | 'high';

export type NewsPriority = 'normal' | 'medium' | 'high';

export interface PipelineNewsItem extends NewsItem {
  fingerprint: string;
  category?: string;
  priority: NewsPriority;
  stage: NewsPipelineStage;
  dedupedAt?: string;
  standbyUntil?: string;
}

export interface StandbyAnalysis {
  eventId: string;
  sentiment: number | null;
  impactScore: number | null;
  confidenceScore: number | null;
  riskLevel: NewsRiskLevel;
  status: 'standby' | 'escalated' | 'dismissed';
  standbyReason?: string;
  tags: string[];
}

export interface TriageDecision {
  analysisId: string;
  status: 'pending' | 'acknowledged' | 'dismissed';
  escalatedTo?: string;
  assignedTo?: string;
  notes?: string;
}

export interface OrchestratorResult {
  ingested: number;
  deduped: number;
  standby: number;
  escalated: number;
  dismissed: number;
  durationMs: number;
}

export interface PipelineConfig {
  feeds: Array<{ url: string; source: string }>;
  standbyMinutes: number;
  maxItems: number;
}

export type SentimentProvider = (
  _title: string,
  _summary?: string
) => Promise<number>;

export type ImpactEstimator = (
  _tickers: string[],
  _category?: string
) => Promise<number>;
