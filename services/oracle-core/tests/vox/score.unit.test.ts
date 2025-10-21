import { describe, it, expect } from 'vitest';
import { computeShock, computeDivergenceHP, computeLeadLag, computeBrigadingScore, computeEmergence, computeCredScore } from '../../digest/vox/score';

describe('Vox Score Derivatives', () => {
  it('computeShock returns z-score of last value', () => {
    const arr = [1, 2, 3, 4, 10];
    const z = computeShock(arr);
    expect(z).toBeGreaterThan(1.5);
  });
  it('computeDivergenceHP returns normalized divergence', () => {
    const vpi = [10, 12];
    const price = [100, 110];
    const div = computeDivergenceHP(vpi, price);
    expect(div).toBeGreaterThan(0);
  });
  it('computeLeadLag finds best lag', () => {
    const vpi = [1, 2, 3, 4, 5, 6];
    const returns = [10, 20, 30, 40, 50, 60];
    const lag = computeLeadLag(vpi, returns, 2);
    expect(typeof lag).toBe('number');
  });
  it('computeBrigadingScore penaliza credibilidad baja y overlap alto', () => {
    expect(computeBrigadingScore(1, 0)).toBe(100);
    expect(computeBrigadingScore(0, 1)).toBe(0);
  });
  it('computeEmergence detecta aceleración', () => {
    expect(computeEmergence([1, 2, 4])).toBe(1);
    expect(computeEmergence([1, 2, 2])).toBe(0);
  });
  it('computeCredScore pondera seguidores, antigüedad y engagement', () => {
    const score = computeCredScore(10000, 365, 0.5);
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThanOrEqual(1);
  });
});
