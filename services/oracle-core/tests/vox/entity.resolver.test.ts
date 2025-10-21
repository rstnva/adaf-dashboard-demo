import { describe, it, expect } from 'vitest';
import { resolveEntity } from '../../digest/vox/nlp';
import goldset from './goldset.json';

describe('Entity Resolver', () => {
  it('achieves ≥98% precision on goldset', () => {
    let correct = 0;
    for (const item of goldset) {
      const result = resolveEntity(item.text);
      if (result === item.expected) {
        correct++;
      } else {
        console.log(`FAIL: "${item.text}" → ${result} (expected: ${item.expected})`);
      }
    }
    const precision = correct / goldset.length;
    console.log(`Precision: ${(precision * 100).toFixed(2)}% (${correct}/${goldset.length})`);
    expect(precision).toBeGreaterThanOrEqual(0.98);
  });
});
