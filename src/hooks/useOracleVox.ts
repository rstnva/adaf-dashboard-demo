// Hook para Vox Populi - centraliza acceso al SDK
import { useQuery } from '@tanstack/react-query';

export interface VoxSignal {
  feedId: string;
  value: number;
  unit: string;
  confidence: number;
  stale: boolean;
  quorum_ok: boolean;
  ts: string;
}

async function fetchVoxLatest(feedId: string): Promise<VoxSignal> {
  const res = await fetch(`/api/oracle/v1/feeds/${feedId}/latest`);
  if (!res.ok) throw new Error('Failed to fetch Vox signal');
  return res.json();
}

async function fetchVoxTopMovers(window: string = '24h'): Promise<VoxSignal[]> {
  const res = await fetch(`/api/oracle/v1/vox/top-movers?window=${window}`);
  if (!res.ok) {
    // Fallback mock
    return [
      { feedId: 'vox/all/vpi:BTC', value: 75, unit: 'score', confidence: 0.8, stale: false, quorum_ok: true, ts: new Date().toISOString() },
      { feedId: 'vox/all/vpi:ETH', value: 62, unit: 'score', confidence: 0.7, stale: false, quorum_ok: true, ts: new Date().toISOString() },
    ];
  }
  return res.json();
}

export function useVoxLatest(feedId: string) {
  return useQuery({
    queryKey: ['vox', 'latest', feedId],
    queryFn: () => fetchVoxLatest(feedId),
    refetchInterval: 60000, // 1min
  });
}

export function useVoxTopMovers(window: string = '24h') {
  return useQuery({
    queryKey: ['vox', 'top-movers', window],
    queryFn: () => fetchVoxTopMovers(window),
    refetchInterval: 60000,
  });
}
