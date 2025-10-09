'use client';

import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui';

export interface FundingData {
  asset: string;
  exchange: string;
  rate: number;
  timestamp: string;
  change24h: number;
  change7d: number;
}

export interface GammaData {
  asset: string;
  tenor: string;
  strike: number;
  gamma: number;
  exposure: number;
  timestamp: string;
}

export function useFundingGamma() {
  const { selectedAssets, range, timezone } = useUIStore();

  // Funding rates data
  const fundingQuery = useQuery({
    queryKey: ['derivs', 'funding', selectedAssets, range, timezone],
  queryFn: async (): Promise<FundingData[]> => {
      const params = new URLSearchParams({
        asset: selectedAssets.join(','),
        days: range.replace('D', ''),
        timezone
      });
      
      const response = await fetch(`/api/read/derivs/funding?${params}`);
      // Si falla, devolvemos [] para no romper la UI
      if (!response.ok) {
        return [];
      }
      const data = await response.json().catch(() => []);
      // Normalización a array
      if (Array.isArray(data)) return data as FundingData[];
      if (data && Array.isArray(data?.data)) return data.data as FundingData[];
      return [];
    },
    staleTime: 120_000, // 2 minutes
    retry: 1,
  });

  // Gamma exposure data
  const gammaQuery = useQuery({
    queryKey: ['derivs', 'gamma', selectedAssets, timezone],
  queryFn: async (): Promise<GammaData[]> => {
      const params = new URLSearchParams({
        asset: selectedAssets.join(','),
        tenors: '7,14,30',
        timezone
      });
      
      const response = await fetch(`/api/read/derivs/gamma?${params}`);
      // Si falla, devolvemos [] para no romper la UI
      if (!response.ok) {
        return [];
      }
      const data = await response.json().catch(() => []);
      // Normalización a array
      if (Array.isArray(data)) return data as GammaData[];
      if (data && Array.isArray(data?.data)) return data.data as GammaData[];
      return [];
    },
    staleTime: 120_000, // 2 minutes
    retry: 1,
  });

  return {
    funding: {
      data: fundingQuery.data,
      isLoading: fundingQuery.isLoading,
      error: fundingQuery.error,
      refetch: fundingQuery.refetch,
    },
    gamma: {
      data: gammaQuery.data,
      isLoading: gammaQuery.isLoading,
      error: gammaQuery.error,
      refetch: gammaQuery.refetch,
    },
    isLoading: fundingQuery.isLoading || gammaQuery.isLoading,
    error: fundingQuery.error || gammaQuery.error,
  };
}