import { describe, it, expect, beforeEach } from 'vitest';

import { evaluateSignal } from '../services/oracle-core/dq/rules';
import {
  getGuardrails,
  invalidateGuardrailsCache,
  getGuardrailManifest,
  getGuardrailManifestMetadata,
} from '../services/oracle-core/dq/guardrails';
import { guardrailManifestLoads } from '../services/oracle-core/metrics/oracle.metrics';
import type { Feed, Signal } from '../services/oracle-core/registry/schema';

const feed: Feed = {
  id: 'stables/liquidity/usdc_eth_depth',
  name: 'USDC/ETH Liquidity Depth',
  category: 'stables',
  unit: 'usd',
  ttl_ms: 300000,
  quorum: { k: 1, n: 1 },
  sources: [{ id: 'mock', weight: 1 }],
  tags: ['stables'],
  version: 1,
};

const baseSignal: Signal = {
  id: 'stables/liquidity/usdc_eth_depth:seed',
  feedId: feed.id,
  ts: new Date().toISOString(),
  value: 100,
  unit: feed.unit,
  confidence: 0.9,
  quorum_ok: true,
  stale: false,
  evidence: [],
  tags: feed.tags,
  rev: 0,
};

describe('oracle guardrails', () => {
  beforeEach(() => {
    invalidateGuardrailsCache();
    guardrailManifestLoads.reset();
  });

  it('loads guardrail manifest with optional reload', async () => {
    const manifest = await getGuardrailManifest();
    expect(manifest).toBeTruthy();
    expect(Object.keys(manifest.feeds ?? {})).toContain(feed.id);

    const metadata = getGuardrailManifestMetadata();
    expect(metadata.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.lastLoadedAt).toBeTruthy();
    expect(metadata.path).toMatch(/guardrails\.json$/);

    const initialMetrics = await guardrailManifestLoads.get();
    const initialSample = initialMetrics.values.find(sample => sample.labels.mode === 'initial');
    expect(initialSample?.value).toBe(1);

    const reloaded = await getGuardrailManifest({ reload: true });
    expect(reloaded.feeds?.[feed.id]?.maxRelativeDelta).toBeDefined();

    const reloadedMetadata = getGuardrailManifestMetadata();
    expect(reloadedMetadata.checksum).toBe(metadata.checksum);
    expect(reloadedMetadata.lastLoadedAt).not.toBe(metadata.lastLoadedAt);
    expect(reloadedMetadata.path).toBe(metadata.path);

    const reloadMetrics = await guardrailManifestLoads.get();
    const reloadSample = reloadMetrics.values.find(sample => sample.labels.mode === 'reload');
    expect(reloadSample?.value).toBe(1);
  });

  it('enforces minimum bound from guardrails', async () => {
    const guardrails = await getGuardrails(feed.id, feed.category);
    expect(guardrails?.min).toBe(0);

    const negativeSignal: Signal = {
      ...baseSignal,
      value: -10,
    };

    const result = evaluateSignal(negativeSignal, { feed, previous: baseSignal, guardrails });
    expect(result.valid).toBe(false);
    expect(result.failures.map(rule => rule.id)).toContain('range:non_negative');
    expect(
      result.checks.some(check => check.rule.id === 'range:non_negative' && check.passed === false)
    ).toBe(true);
  });

  it('enforces relative delta limits from guardrails', async () => {
    const guardrails = await getGuardrails(feed.id, feed.category);
    expect(guardrails?.maxRelativeDelta).toBeLessThanOrEqual(2);

    const spikySignal: Signal = {
      ...baseSignal,
      value: baseSignal.value * 5,
    };

    const result = evaluateSignal(spikySignal, { feed, previous: baseSignal, guardrails });
    expect(result.valid).toBe(false);
    expect(result.failures.map(rule => rule.id)).toContain('delta:relative_jump');
    expect(
      result.checks.some(check => check.rule.id === 'delta:relative_jump' && check.passed === false)
    ).toBe(true);
  });
});
