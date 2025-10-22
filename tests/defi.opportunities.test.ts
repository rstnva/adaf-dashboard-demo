import { describe, it, expect, vi, afterEach } from 'vitest';

import { getDefiOpportunities } from '@/lib/defi/opportunities';
import type { RawDefiLlamaPool } from '@/lib/defi/types';

const buildFetchResponse = (pools: RawDefiLlamaPool[]) => ({
  ok: true,
  json: async () => ({ data: pools }),
});

describe('getDefiOpportunities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes pools and prioritizes flagship protocols', async () => {
    const mockPools: RawDefiLlamaPool[] = [
      {
        chain: 'Ethereum',
        project: 'Gearbox',
        symbol: 'ETH',
        pool: 'gearbox-eth-leverage',
        apy: 8.5,
        tvlUsd: 55_000_000,
        stablecoin: false,
        poolMeta: 'ETH leverage vault',
        ilRisk: 'low',
        auditScore: 88,
        apyBase: 7.2,
        apyReward: 1.3,
        apyPct1D: 0.2,
        apyPct7D: 0.4,
        apyPct30D: 0.8,
        url: 'https://gearbox.fi',
        exposure: 'structured',
        predictions: null,
        updatedAt: Date.now(),
      },
      {
        chain: 'Arbitrum',
        project: 'RandomProtocol',
        symbol: 'USDC',
        pool: 'randomprotocol-usdc-yield',
        apy: 12.3,
        tvlUsd: 12_000_000,
        stablecoin: true,
        poolMeta: 'Stablecoin yield vault',
        ilRisk: 'medium',
        auditScore: 55,
        exposure: 'lending',
        predictions: null,
        updatedAt: Date.now() - 1_000,
      },
      {
        chain: 'Base',
        project: 'SummerFi',
        symbol: 'ETH',
        pool: 'summerfi-eth-restake',
        apy: 7.1,
        tvlUsd: 4_500_000,
        stablecoin: false,
        poolMeta: 'Restaking strategy',
        ilRisk: 'low',
        auditScore: 70,
        exposure: 'restake',
        predictions: null,
        updatedAt: Date.now() - 2_000,
      },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(buildFetchResponse(mockPools) as unknown as Response);

    const result = await getDefiOpportunities();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://yields.llama.fi/pools'),
      expect.objectContaining({ next: { revalidate: 60 } })
    );
    expect(result.opportunities).toHaveLength(3);
  expect(result.opportunities[0]?.protocol).toBe('Gearbox');
  expect(result.opportunities[0]?.riskLevel).toBe('low');
  expect(result.opportunities[1]?.protocol).toBe('SummerFi');
  expect(result.opportunities[2]?.protocol).toBe('RandomProtocol');
  });

  it('applies filters for chain, stablecoin focus and min apy', async () => {
    const mockPools: RawDefiLlamaPool[] = [
      {
        chain: 'Ethereum',
        project: 'Gearbox',
        symbol: 'ETH',
        pool: 'gearbox-eth',
        apy: 8.5,
        tvlUsd: 10_000_000,
        stablecoin: false,
        poolMeta: 'Leverage',
        ilRisk: 'low',
        auditScore: 90,
        exposure: 'structured',
        predictions: null,
        updatedAt: Date.now(),
      },
      {
        chain: 'Arbitrum',
        project: 'StableDAO',
        symbol: 'USDC',
        pool: 'stabledao-usdc',
        apy: 11.4,
        tvlUsd: 7_500_000,
        stablecoin: true,
        poolMeta: 'Stablecoin vault',
        ilRisk: 'medium',
        auditScore: 60,
        exposure: 'lending',
        predictions: null,
        updatedAt: Date.now(),
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(mockPools) as unknown as Response
    );

    const result = await getDefiOpportunities({
      chains: ['arbitrum'],
      minApy: 10,
      stablecoinOnly: true,
    });

    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]?.protocol).toBe('StableDAO');
    expect(result.opportunities[0]?.chain).toBe('Arbitrum');
    expect(result.opportunities[0]?.stablecoin).toBe(true);
  });

  it('propagates errors when the upstream API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as unknown as Response);

    await expect(
      getDefiOpportunities({ maxResults: 5 })
    ).rejects.toThrow('Failed to fetch DeFi pools (502)');
  });
});
