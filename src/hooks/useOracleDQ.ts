'use client';

import { useQuery } from '@tanstack/react-query';

export type DqSeverityStatus = 'healthy' | 'warning' | 'critical';
export type DqTrendStatus = 'improving' | 'stable' | 'deteriorating';

export interface DqSeverity {
  status: DqSeverityStatus;
  recommendation: string;
}

export interface DqTrendDelta {
  pass: number;
  fail: number;
  failureRatio: number;
}

export interface DqTrend {
  status: DqTrendStatus;
  delta: DqTrendDelta;
  recommendation: string;
}

export interface DqShadowRmse {
  rmse: number;
  baseline: number;
  samples: number;
  lastUpdated: string;
  feeds?: number;
}

export interface DqRuleSummary {
  rule: string;
  pass: number;
  fail: number;
  total: number;
  failureRatio: number;
  severity: DqSeverity;
  trend: DqTrend;
}

export interface DqFeedSummary {
  feed: string;
  pass: number;
  fail: number;
  total: number;
  failureRatio: number;
  severity: DqSeverity;
  trend: DqTrend;
  rules: DqRuleSummary[];
  shadowRmse?: DqShadowRmse;
}

export interface DqSummaryResponse {
  generatedAt: string;
  totals: {
    pass: number;
    fail: number;
    total: number;
    failureRatio: number;
    severity: DqSeverity;
    trend: DqTrend;
    shadowRmse?: DqShadowRmse;
  };
  feeds: DqFeedSummary[];
}

interface ApiResponse {
  ok: boolean;
  summary?: DqSummaryResponse;
  error?: string;
  generatedAt?: string;
}

export function useOracleDQSummary(feedId?: string) {
  const summaryQuery = useQuery({
    queryKey: ['oracle', 'dq-summary', feedId ?? 'all'],
    queryFn: async (): Promise<DqSummaryResponse> => {
      const params = new URLSearchParams();
      if (feedId) {
        params.set('feed', feedId);
      }

      const response = await fetch(`/api/read/oracle/dq/summary${params.size ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error(`Oracle DQ summary API error: ${response.status}`);
      }
      const payload: ApiResponse = await response.json();
      if (!payload.ok || !payload.summary) {
        throw new Error(payload.error || 'Oracle DQ summary payload inválido');
      }
      return payload.summary;
    },
    staleTime: 30_000,
    gcTime: 120_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    summary: summaryQuery.data,
    isLoading: summaryQuery.isLoading,
    error: summaryQuery.error,
    refetch: summaryQuery.refetch,
  };
}
