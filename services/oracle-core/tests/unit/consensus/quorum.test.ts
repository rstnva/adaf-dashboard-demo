import { describe, expect, it } from 'vitest';

import { quorumSatisfied, type QuorumConfig } from '../../../consensus/quorum';

describe('quorum validation', () => {
  it('passes when k of n samples are eligible', () => {
    const config: QuorumConfig = { k: 3, n: 5 };
    const eligible = [true, true, true, false, false];

    expect(quorumSatisfied(eligible, config)).toBe(true);
  });

  it('fails when less than k samples are eligible', () => {
    const config: QuorumConfig = { k: 3, n: 5 };
    const eligible = [true, true, false, false, false];

    expect(quorumSatisfied(eligible, config)).toBe(false);
  });

  it('passes when all n samples are eligible', () => {
    const config: QuorumConfig = { k: 2, n: 3 };
    const eligible = [true, true, true];

    expect(quorumSatisfied(eligible, config)).toBe(true);
  });

  it('fails when no samples are eligible', () => {
    const config: QuorumConfig = { k: 2, n: 3 };
    const eligible = [false, false, false];

    expect(quorumSatisfied(eligible, config)).toBe(false);
  });

  it('passes with exactly k eligible samples', () => {
    const config: QuorumConfig = { k: 2, n: 4 };
    const eligible = [true, true, false, false];

    expect(quorumSatisfied(eligible, config)).toBe(true);
  });

  it('handles k=1 (any single source is enough)', () => {
    const config: QuorumConfig = { k: 1, n: 3 };
    const eligible = [false, false, true];

    expect(quorumSatisfied(eligible, config)).toBe(true);
  });

  it('handles k=n (requires all sources)', () => {
    const config: QuorumConfig = { k: 3, n: 3 };
    const eligibleAll = [true, true, true];
    const eligibleMissing = [true, true, false];

    expect(quorumSatisfied(eligibleAll, config)).toBe(true);
    expect(quorumSatisfied(eligibleMissing, config)).toBe(false);
  });

  it('ignores excess eligible samples beyond n', () => {
    const config: QuorumConfig = { k: 2, n: 3 };
    const eligible = [true, true, true, true, true]; // 5 samples, only first 3 matter

    expect(quorumSatisfied(eligible, config)).toBe(true);
  });
});
