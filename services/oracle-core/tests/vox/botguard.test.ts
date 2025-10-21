import { describe, it, expect } from 'vitest';
import { computeBurstOverlapIndex, computeCredWithDecay, detectLanguageTimezoneAnomaly, computeFinalBrigadingScore } from '../../digest/vox/botguard';

describe('Antibots & Botguard', () => {
  it('computeBurstOverlapIndex detects coordinated bursts', () => {
    const coordinated = [
      { source_id: 'x', timestamp: 1000000, volume: 100 },
      { source_id: 'reddit', timestamp: 1000050, volume: 90 },
      { source_id: 'telegram', timestamp: 1000100, volume: 80 },
    ];
    const overlap = computeBurstOverlapIndex(coordinated);
    expect(overlap).toBeGreaterThan(0.9);
  });
  
  it('computeCredWithDecay applies exponential decay', () => {
    const fresh = computeCredWithDecay(0.8, 365, 1, 0.1);
    const stale = computeCredWithDecay(0.8, 365, 240, 0.1);
    expect(fresh).toBeGreaterThan(stale);
    expect(stale).toBeLessThan(0.5);
  });
  
  it('detectLanguageTimezoneAnomaly flags mismatches', () => {
    const match = detectLanguageTimezoneAnomaly('en', 'UTC', 'en', 'UTC');
    const mismatch = detectLanguageTimezoneAnomaly('ru', 'Asia/Moscow', 'en', 'UTC');
    expect(match).toBe(0);
    expect(mismatch).toBeGreaterThan(0.5);
  });
  
  it('computeFinalBrigadingScore aggregates signals', () => {
    const high = computeFinalBrigadingScore(1, 0.2, 0.8);
    const low = computeFinalBrigadingScore(0, 1, 0);
    expect(high).toBeGreaterThan(70);
    expect(low).toBe(0);
  });
  
  it('false positives <5% on synthetic fixtures', () => {
    // Simulate 100 legitimate accounts
    const legit = Array.from({ length: 100 }, (_, i) => ({
      baseScore: 0.7 + Math.random() * 0.2,
      accountAgeDays: 180 + i,
      lastActivityHours: Math.random() * 24,
    }));
    
    let falsePositives = 0;
    for (const user of legit) {
      const cred = computeCredWithDecay(user.baseScore, user.accountAgeDays, user.lastActivityHours);
      if (cred < 0.5) {
        falsePositives++;
      }
    }
    
    const fpRate = falsePositives / legit.length;
    console.log(`False positive rate: ${(fpRate * 100).toFixed(2)}%`);
    expect(fpRate).toBeLessThan(0.05);
  });
});
