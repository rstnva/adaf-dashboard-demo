import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

import { useOnchain, type TvlHeatmapData, type TvlHeatmapRange } from '@/hooks';
import { useUIStore } from '@/store/ui';

const MOCK_RESPONSES: Record<TvlHeatmapRange, TvlHeatmapData[]> = {
  7: [
    {
      protocol: 'Lido',
      tvl: 100_000_000,
      change7d: 2.5,
      change30d: 6.1,
      category: 'liquid-staking',
      chain: 'Ethereum',
    },
  ],
  14: [
    {
      protocol: 'Aave',
      tvl: 75_000_000,
      change7d: -1.2,
      change30d: 3.4,
      category: 'lending',
      chain: 'Polygon',
    },
  ],
  30: [
    {
      protocol: 'MakerDAO',
      tvl: 125_000_000,
      change7d: 0.4,
      change30d: 4.8,
      category: 'cdp',
      chain: 'Ethereum',
    },
  ],
};

const createWrapper = (client: QueryClient) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useOnchain heatmap caching', () => {
  let queryClient: QueryClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useUIStore.setState({ timezone: 'America/Mexico_City' });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 0,
          gcTime: 5 * 60 * 1000,
        },
      },
    });

    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const resolved = url.startsWith('http') ? url : `http://localhost${url}`;
      const { searchParams } = new URL(resolved);
      const daysParam = Number(searchParams.get('days') ?? '7') as TvlHeatmapRange;
      const body = MOCK_RESPONSES[daysParam] ?? [];

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as unknown as typeof fetch);
  });

  afterEach(() => {
    queryClient.getMutationCache().clear();
    queryClient.getQueryCache().clear();
    vi.restoreAllMocks();
  });

  it('hydrates default range and reuses cached data on subsequent reads', async () => {
    const { result } = renderHook(() => useOnchain(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.tvlHeatmap.data).toEqual(MOCK_RESPONSES[7]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();

    await act(async () => {
      const fourteenDay = await result.current.getTvlHeatmapByDays(14);
      expect(fourteenDay).toEqual(MOCK_RESPONSES[14]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();

    const cachedFourteen = result.current.getCachedTvlHeatmap(14);
    expect(cachedFourteen).toEqual(MOCK_RESPONSES[14]);

    await act(async () => {
      const rerun = await result.current.getTvlHeatmapByDays(14);
      expect(rerun).toEqual(MOCK_RESPONSES[14]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('prefetches alternate ranges and serves them without extra network calls', async () => {
    const { result } = renderHook(() => useOnchain(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.tvlHeatmap.data).toEqual(MOCK_RESPONSES[7]);
    });

    fetchMock.mockClear();

    await act(async () => {
      await result.current.prefetchTvlHeatmap(30);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();

    await act(async () => {
      const thirtyDay = await result.current.getTvlHeatmapByDays(30);
      expect(thirtyDay).toEqual(MOCK_RESPONSES[30]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });
});
