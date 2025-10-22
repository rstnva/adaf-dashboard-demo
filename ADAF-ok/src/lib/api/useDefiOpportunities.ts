import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import type { DefiOpportunity, DefiOpportunitiesResponse } from '@/lib/defi/types';

export interface UseDefiOpportunitiesParams {
  search?: string;
  chains?: string[];
  protocols?: string[];
  minApy?: number;
  stablecoinOnly?: boolean;
}

const buildQueryString = (params: UseDefiOpportunitiesParams) => {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.chains?.length) query.set('chains', params.chains.join(','));
  if (params.protocols?.length) query.set('protocols', params.protocols.join(','));
  if (params.minApy !== undefined) query.set('minApy', String(params.minApy));
  if (params.stablecoinOnly) query.set('stablecoinOnly', 'true');

  return query.toString();
};

const fetchOpportunities = async (params: UseDefiOpportunitiesParams): Promise<DefiOpportunitiesResponse> => {
  const queryString = buildQueryString(params);
  const url = queryString ? `/api/defi/opportunities?${queryString}` : '/api/defi/opportunities';

  const response = await fetch(url);
  if (!response.ok) {
    throw Object.assign(new Error('Failed to load DeFi opportunities'), { status: response.status });
  }

  return response.json();
};

export function useDefiOpportunities(params: UseDefiOpportunitiesParams = {}) {
  const queryKey = useMemo(() => ['defi-opportunities', params], [params]);

  return useQuery<{ opportunities: DefiOpportunity[]; updatedAt: number } & Partial<DefiOpportunitiesResponse>>({
    queryKey,
    queryFn: () => fetchOpportunities(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}
