import { describe, expect, it } from 'vitest';
import { PolicyGuard } from '../core/PolicyGuard';
import { RiskRules } from '@lav-adaf/wallet';
import type { SimulationRequest } from '@lav-adaf/integrations';
import type { RiskContext } from '@lav-adaf/wallet';

describe('PolicyGuard', () => {
  const riskRules = new RiskRules();
  const policy = new PolicyGuard(riskRules, {
    allowlist: ['0xaaaa'],
    slippageBpsLimit: 50,
  });

  const request: SimulationRequest = {
    from: '0xbbbb',
    to: '0xaaaa',
    data: '0x',
    slippageBps: 25,
  };

  const context: RiskContext = {
    address: '0xbbbb',
    portfolioValueUsd: 100_000,
    positionSizeUsd: 10_000,
    ltv: 0.4,
  };

  it('approves valid request', () => {
    const decision = policy.enforce(request, context);
    expect(decision.allowed).toBe(true);
    expect(decision.violations).toHaveLength(0);
  });

  it('rejects when slippage exceeds limit', () => {
    const decision = policy.enforce({ ...request, slippageBps: 80 }, context);
    expect(decision.allowed).toBe(false);
    expect(decision.violations.some(v => v.rule === 'slippage_bps')).toBe(true);
  });

  it('rejects non-allowlisted destination', () => {
    const decision = policy.enforce({ ...request, to: '0xcccc' }, context);
    expect(decision.allowed).toBe(false);
    expect(decision.violations.some(v => v.rule === 'allowlist')).toBe(true);
  });
});
