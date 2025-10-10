import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/lib/wsp/norm/store', () => {
  const readStats = vi.fn(async (key: string) => {
    if (key.includes('vix')) return { mean: 20, m2: 36 * 10, count: 11 };
    if (key.includes('dxy')) return { mean: 100, m2: 16 * 10, count: 11 };
    return null;
  });
  const readPctl = vi.fn(async () => ({ p5: { q: [0, 0, -50_000_000, 0, 0] }, p95: { q: [0, 0, 250_000_000, 0, 0] } }));
  return {
    readStats,
    readPctl,
    NORM_KEYS: {
      vix: 'vix',
      dxy: 'dxy',
      etfBtc: 'etfBtc',
      etfEth: 'etfEth',
    },
    __esModule: true,
  };
});
import { calculateWSPS, normalizeInputs, smoothAndHysteresis } from '../src/components/dashboard/wsp/utils/scoring';

describe('scoring normalization', () => {
  it('uses fallbacks when no stats', async () => {
    // Override the mock to return nulls for all normalization keys
    const store = await import('@/lib/wsp/norm/store');
    const readStatsSpy = vi.spyOn(store, 'readStats').mockImplementation(async () => null);
    const readPctlSpy = vi.spyOn(store, 'readPctl').mockImplementation(async () => null);
    const { inputs, normalization } = await normalizeInputs({ vix: 18, dxy: 100, etfBtcFlow: 0, etfEthFlow: 0, spread2s10s: 0, spxNdXMom: { spx: 0, ndx: 0 } });
    Object.values(inputs).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
    Object.values(inputs).forEach(v => expect(v).toBeLessThanOrEqual(1));
    expect(normalization.source).toBe('fallback');
    const base = calculateWSPS(inputs as any);
    expect(base.score).toBeGreaterThanOrEqual(0);
    expect(base.score).toBeLessThanOrEqual(100);
    // Restore the default vi.mock implementation for the next test
    readStatsSpy.mockRestore();
    readPctlSpy.mockRestore();
  });

  it('uses redis stats when available', async () => {
    // Use the default vi.mock above (returns redis-like data)
    const { inputs, normalization } = await normalizeInputs({ vix: 26, dxy: 96, etfBtcFlow: 100_000_000, etfEthFlow: 50_000_000, spread2s10s: -0.5, spxNdXMom: { spx: 1, ndx: 1 } });
    expect(normalization.source).toBe('redis');
    expect(inputs.ETF_BTC_FLOW_NORM).toBeGreaterThan(inputs.ETF_ETH_FLOW_NORM - 0.0001);
  });
});

describe('EMA + hysteresis', () => {
  it('smooths and avoids flapping near thresholds', async () => {
    const series = [34, 35, 36, 37, 38, 39, 40, 41, 42];
    let lastColor: string | null = null;
    for (const s of series) {
      const res = await smoothAndHysteresis(s, 0.2, 3);
      if (lastColor) {
        if (Math.abs(s - 40) < 3) {
          // near threshold, should not constantly flip
          expect(res.color === lastColor || res.color === 'yellow').toBeTruthy();
        }
      }
      lastColor = res.color;
    }
  });
});
