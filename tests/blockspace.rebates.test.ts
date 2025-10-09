import { RebateCalculator } from '../src/lib/blockspace/rebates';

describe('RebateCalculator', () => {
  it('calcula rebate para volumen pro', () => {
    const result = RebateCalculator.calculate(2_000_000);
    expect(result.tier).toBe('pro');
    expect(result.rebate).toBeCloseTo(0.0025);
  });
  it('calcula rebate para volumen plus', () => {
    const result = RebateCalculator.calculate(200_000);
    expect(result.tier).toBe('plus');
    expect(result.rebate).toBeCloseTo(0.001);
  });
  it('calcula rebate para volumen básico', () => {
    const result = RebateCalculator.calculate(10_000);
    expect(result.tier).toBe('basic');
    expect(result.rebate).toBeCloseTo(0.0005);
  });
});
