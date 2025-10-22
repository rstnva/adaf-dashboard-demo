import { describe, it, expect } from 'vitest';
import { applyCUSUM, isInCooldown, normalizeDiurnality, quarantineFeed, checkVoxQuarantine, clearExpiredQuarantines } from '../../dq/vox.rules';
import type { Signal } from '../../registry/schema';

describe('Vox DQ & Quarantine', () => {
  it('applyCUSUM detects sustained shifts', () => {
    const stable = [10, 10.5, 9.8, 10.2, 10.1];
    const shifted = [10, 10, 10, 15, 15, 15];
    expect(applyCUSUM(stable, 3)).toBe(false);
    expect(applyCUSUM(shifted, 3)).toBe(true);
  });
  
  it('isInCooldown returns true within cooldown window', () => {
    quarantineFeed('vox/test:BTC', 'VOX_BRIGADING', 900000); // 15min duration
    expect(isInCooldown('vox/test:BTC', 15)).toBe(true); // Check within 15min window
    expect(isInCooldown('vox/nonexistent:ETH', 15)).toBe(false); // No quarantine
  });
  
  it('normalizeDiurnality penalizes off-hours', () => {
    const peak = normalizeDiurnality(100, 12); // Noon
    const offHours = normalizeDiurnality(100, 3); // 3am
    expect(peak).toBe(100);
    expect(offHours).toBe(70);
  });
  
  it('checkVoxQuarantine triggers on outlier', () => {
    const signal: Signal = {
      id: 'sig1',
      feedId: 'vox/x/volume:BTC',
      ts: new Date().toISOString(),
      value: 1000,
      unit: 'count',
      confidence: 0.7,
      quorum_ok: true,
      stale: false,
      evidence: [],
      tags: [],
      rev: 1,
    };
    const history = [10, 10, 10, 1000]; // Outlier
    const quarantined = checkVoxQuarantine(signal, history);
    expect(quarantined).toBe(true);
  });
  
  it('clearExpiredQuarantines removes old entries', () => {
    quarantineFeed('vox/expired:BTC', 'VOX_TEST', 1); // 1ms
    setTimeout(() => {
      clearExpiredQuarantines();
      expect(isInCooldown('vox/expired:BTC', 1)).toBe(false);
    }, 10);
  });
});
