import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function jsonFetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || response.statusText);
    (error as any).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

export interface NewsOracleStandbyItem {
  analysis: {
    id: string;
    status: string;
    riskLevel: string;
    sentiment: number | null;
    impactScore: number | null;
    confidenceScore: number | null;
    standbyReason?: string | null;
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
  event: {
    id: string;
    title: string;
    source: string;
    category?: string | null;
    priority: string;
    publishedAt: string;
    tickers: string[];
    keywords: string[];
    summary?: string | null;
    status: string;
    standbyUntil?: string | null;
  };
  triage: Array<{
    id: string;
    status: string;
    escalatedTo?: string | null;
    assignedTo?: string | null;
    notes?: string | null;
    updatedAt: string;
  }>;
}

export interface NewsOracleRunResult {
  ingested: number;
  deduped: number;
  standby: number;
  escalated: number;
  dismissed: number;
  durationMs: number;
}

export function useNewsOracle(enabled: boolean) {
  const queryClient = useQueryClient();

  const standby = useQuery<NewsOracleStandbyItem[]>({
    queryKey: ['news-oracle', 'standby'],
    queryFn: () => jsonFetcher<NewsOracleStandbyItem[]>('/api/news/oracle/standby'),
    enabled,
    retry: false,
  });

  const triage = useQuery<NewsOracleStandbyItem[]>({
    queryKey: ['news-oracle', 'triage'],
    queryFn: () => jsonFetcher<NewsOracleStandbyItem[]>('/api/news/oracle/triage'),
    enabled,
    retry: false,
  });

  const runPipeline = useMutation<NewsOracleRunResult, Error, void>({
    mutationFn: () => jsonFetcher<NewsOracleRunResult>('/api/news/oracle/run', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-oracle', 'standby'] });
      queryClient.invalidateQueries({ queryKey: ['news-oracle', 'triage'] });
    },
  });

  return {
    standby,
    triage,
    runPipeline,
  };
}
