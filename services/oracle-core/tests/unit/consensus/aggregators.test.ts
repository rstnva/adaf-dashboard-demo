import { describe, expect, it } from 'vitest';

import { weightedMedian, trimmedMean, type WeightedSample } from '../../../consensus/aggregators';

describe('consensus aggregators', () => {
  describe('weightedMedian', () => {
    it('computes weighted median for odd samples', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 1 },
        { value: 200, weight: 2 },
        { value: 300, weight: 1 },
      ];

      const result = weightedMedian(samples);
      expect(result).toBe(200);
    });

    it('computes weighted median for even samples', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 1 },
        { value: 200, weight: 1 },
        { value: 300, weight: 1 },
        { value: 400, weight: 1 },
      ];

      const result = weightedMedian(samples);
      // With equal weights (total 4), threshold is 2, crosses at 200
      expect(result).toBe(200);
    });

    it('handles single sample', () => {
      const samples: WeightedSample[] = [{ value: 42, weight: 1 }];
      expect(weightedMedian(samples)).toBe(42);
    });

    it('throws on empty array', () => {
      expect(() => weightedMedian([])).toThrow('weightedMedian requires samples');
    });

    it('respects weights in threshold calculation', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 0.1 },
        { value: 200, weight: 0.8 },
        { value: 300, weight: 0.1 },
      ];

      const result = weightedMedian(samples);
      expect(result).toBe(200);
    });
  });

  describe('trimmedMean', () => {
    it('computes trimmed mean with default 10% trim', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 1 },
        { value: 110, weight: 1 },
        { value: 120, weight: 1 },
        { value: 130, weight: 1 },
        { value: 140, weight: 1 },
        { value: 150, weight: 1 },
        { value: 160, weight: 1 },
        { value: 170, weight: 1 },
        { value: 180, weight: 1 },
        { value: 190, weight: 1 },
      ];

      const result = trimmedMean(samples);
      // Trimmed 10% from each end = removes 1 from top & bottom
      // Mean of [110, 120, 130, 140, 150, 160, 170, 180]
      const expected = (110 + 120 + 130 + 140 + 150 + 160 + 170 + 180) / 8;
      expect(result).toBeCloseTo(expected, 1);
    });

    it('computes trimmed mean with custom trim ratio', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 1 },
        { value: 200, weight: 1 },
        { value: 300, weight: 1 },
        { value: 400, weight: 1 },
        { value: 500, weight: 1 },
      ];

      const result = trimmedMean(samples, 0.2);
      // Trimmed 20% from each end = removes 1 from top & bottom
      // Mean of [200, 300, 400]
      expect(result).toBeCloseTo(300, 1);
    });

    it('respects weights in weighted average', () => {
      const samples: WeightedSample[] = [
        { value: 100, weight: 0.1 },
        { value: 200, weight: 0.8 },
        { value: 300, weight: 0.1 },
      ];

      const result = trimmedMean(samples, 0);
      // No trimming, weighted mean
      const expected = (100 * 0.1 + 200 * 0.8 + 300 * 0.1) / 1.0;
      expect(result).toBeCloseTo(expected, 1);
    });

    it('throws on empty array', () => {
      expect(() => trimmedMean([])).toThrow('trimmedMean requires samples');
    });

    it('handles single sample', () => {
      const samples: WeightedSample[] = [{ value: 42, weight: 1 }];
      expect(trimmedMean(samples)).toBe(42);
    });
  });

  describe('outlier rejection via trimming', () => {
    it('trimmedMean rejects extreme outliers effectively', () => {
      const samples: WeightedSample[] = [
        { value: 1000, weight: 1 },
        { value: 1010, weight: 1 },
        { value: 1020, weight: 1 },
        { value: 1030, weight: 1 },
        { value: 1040, weight: 1 },
        { value: 9999, weight: 1 }, // extreme outlier
      ];

      const result = trimmedMean(samples, 0.2);
      // Trimmed 20% = removes 1 from each end (9999 and 1000)
      // Mean of [1010, 1020, 1030, 1040]
      const expected = (1010 + 1020 + 1030 + 1040) / 4;
      expect(result).toBeCloseTo(expected, 1);
      expect(result).toBeLessThan(2000); // Should not be skewed by outlier
    });
  });
});
