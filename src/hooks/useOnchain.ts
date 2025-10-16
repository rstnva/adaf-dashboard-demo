'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui';

export interface TvlHeatmapData {
  protocol: string;
  tvl: number;
  change7d: number;
  change30d: number;
  category: string;
  chain: string;
}

export type TvlHeatmapRange = 7 | 14 | 30;

const TVL_HEATMAP_STALE_TIME_MS = 120_000; // 2 minutes
const TVL_HEATMAP_GC_TIME_MS = TVL_HEATMAP_STALE_TIME_MS * 3;

interface StablecoinFlowData {
  token: string;
  netFlow24h: number;
  netFlow7d: number;
  totalSupply: number;
  timestamp: string;
}

export function useOnchain() {
  const { timezone } = useUIStore();
  const defaultHeatmapRange: TvlHeatmapRange = 7;
  const queryClient = useQueryClient();

  const buildTvlHeatmapKey = useCallback(
    (days: number) => ['onchain', 'tvl-heatmap', days, timezone] as const,
    [timezone]
  );

  const fetchTvlHeatmap = useCallback(async (days: number): Promise<TvlHeatmapData[]> => {
    const params = new URLSearchParams({
      days: days.toString(),
      timezone,
    });

    const response = await fetch(`/api/read/onchain/tvl-heatmap?${params}`);
    if (!response.ok) {
      throw new Error(`TVL Heatmap API error: ${response.status}`);
    }

    return response.json();
  }, [timezone]);

  // TVL Heatmap data
  const tvlHeatmapQuery = useQuery({
    queryKey: buildTvlHeatmapKey(defaultHeatmapRange),
    queryFn: () => fetchTvlHeatmap(defaultHeatmapRange),
    staleTime: TVL_HEATMAP_STALE_TIME_MS,
    retry: 1,
  });

  // Stablecoin flows (placeholder for future implementation)
  const stablecoinFlowsQuery = useQuery({
    queryKey: ['onchain', 'stablecoin-flows', timezone],
    queryFn: async (): Promise<StablecoinFlowData[]> => {
      // Placeholder - return mock data until endpoint is implemented
      return [
        {
          token: 'USDT',
          netFlow24h: 45_000_000,
          netFlow7d: 280_000_000,
          totalSupply: 120_000_000_000,
          timestamp: new Date().toISOString()
        },
        {
          token: 'USDC',
          netFlow24h: -12_000_000,
          netFlow7d: 95_000_000,
          totalSupply: 85_000_000_000,
          timestamp: new Date().toISOString()
        }
      ];
    },
    staleTime: TVL_HEATMAP_STALE_TIME_MS,
    retry: 1,
  });

  const getCachedTvlHeatmap = useCallback(
    (days: TvlHeatmapRange) =>
      queryClient.getQueryData<TvlHeatmapData[]>(buildTvlHeatmapKey(days)),
    [queryClient, buildTvlHeatmapKey]
  );

  const getTvlHeatmapByDays = useCallback(
    async (days: TvlHeatmapRange): Promise<TvlHeatmapData[]> => {
      return queryClient.fetchQuery({
        queryKey: buildTvlHeatmapKey(days),
        queryFn: () => fetchTvlHeatmap(days),
        staleTime: TVL_HEATMAP_STALE_TIME_MS,
        gcTime: TVL_HEATMAP_GC_TIME_MS,
      });
    },
    [queryClient, buildTvlHeatmapKey, fetchTvlHeatmap]
  );

  const prefetchTvlHeatmap = useCallback(
    async (days: TvlHeatmapRange) => {
      return queryClient.prefetchQuery({
        queryKey: buildTvlHeatmapKey(days),
        queryFn: () => fetchTvlHeatmap(days),
        staleTime: TVL_HEATMAP_STALE_TIME_MS,
        gcTime: TVL_HEATMAP_GC_TIME_MS,
      });
    },
    [queryClient, buildTvlHeatmapKey, fetchTvlHeatmap]
  );

  return {
    tvlHeatmap: {
      data: tvlHeatmapQuery.data,
      isLoading: tvlHeatmapQuery.isLoading,
      error: tvlHeatmapQuery.error,
      refetch: tvlHeatmapQuery.refetch,
    },
    getCachedTvlHeatmap,
    stablecoinFlows: {
      data: stablecoinFlowsQuery.data,
      isLoading: stablecoinFlowsQuery.isLoading,
      error: stablecoinFlowsQuery.error,
      refetch: stablecoinFlowsQuery.refetch,
    },
    prefetchTvlHeatmap,
    getTvlHeatmapByDays,
    isLoading: tvlHeatmapQuery.isLoading || stablecoinFlowsQuery.isLoading,
    error: tvlHeatmapQuery.error || stablecoinFlowsQuery.error,
  };
}