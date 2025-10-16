import type { NewsEvent } from '@prisma/client';
import type { NewsPriority, NewsRiskLevel } from '../types';

const CATEGORY_IMPACT: Record<string, number> = {
  security: 0.9,
  regulation: 0.7,
  institutional: 0.6,
  defi: 0.5,
  macro: 0.4,
  general: 0.3,
};

const PRIORITY_IMPACT: Record<NewsPriority, number> = {
  high: 1,
  medium: 0.7,
  normal: 0.4,
};

export function estimateImpact(event: NewsEvent): number {
  const categoryImpact = CATEGORY_IMPACT[event.category || 'general'] ?? 0.3;
  const priorityImpact = PRIORITY_IMPACT[event.priority as NewsPriority] ?? 0.4;
  const tickersImpact = Math.min(event.tickers.length * 0.05, 0.3);

  return Number((categoryImpact * 0.6 + priorityImpact * 0.3 + tickersImpact).toFixed(2));
}

export function deriveRiskLevel(
  impactScore: number,
  sentiment: number
): NewsRiskLevel {
  if (impactScore >= 0.8 || sentiment <= -0.5) return 'high';
  if (impactScore >= 0.5 || sentiment <= -0.2) return 'moderate';
  return 'low';
}
