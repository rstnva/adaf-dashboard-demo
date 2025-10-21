import { performance } from 'node:perf_hooks';

import { normalizeSignal } from './digest/normalize';
import { normalizeUnit } from './digest/units';
import { applyQualityGuards } from './digest/quality';
import { weightedMedian, trimmedMean } from './consensus/aggregators';
import { quorumSatisfied, type QuorumConfig } from './consensus/quorum';
import { validateSignal } from './consensus/validators';
import type { Feed, Signal } from './registry/schema';
import { recordProvenance } from './lineage/provenance';
import { storeSignal, fetchLatestSignal } from './storage/pg';
import { cacheSignal } from './storage/redis';
import { appendSeries } from './storage/tsdb';
import { nextRevision } from './storage/revisions';
import { evaluateSignal } from './dq/rules';
import { quarantineSignal, isFeedQuarantined } from './dq/quarantine';
import { getGuardrails } from './dq/guardrails';
import { updateShadowRmse } from './dq/shadow-rmse';
import {
  ingestTotal,
  ingestFailTotal,
  digestLatency,
  consensusLatency,
  signalsTotal,
  staleRatio,
  quorumFailTotal,
  dqFailureTotal,
  dqEvaluationsTotal,
} from './metrics/oracle.metrics';
import { publishSignalUpdate } from './serve/api/ws';
import * as feedPolicies from './registry/feed-policies';
import { updateRpcHeartbeat, resolveBaseline } from './monitoring/heartbeats';

export interface RawSampleMetadata {
  confidenceInterval?: number;
  referenceId?: string;
  penalty?: number;
  [key: string]: unknown;
}

export interface RawSample {
  value: number;
  weight: number;
  evidence: Signal['evidence'];
  confidence: number;
  provider: string;
  sourceId: string;
  updatedAt: Date;
  latencyMs?: number;
  quorumEligible?: boolean;
  metadata?: RawSampleMetadata;
}

export interface PipelineContext {
  feed: Feed;
  samples: RawSample[];
}

function ensureQuorumConfig(quorum: Feed['quorum']): QuorumConfig {
  if (typeof quorum?.k !== 'number' || typeof quorum?.n !== 'number') {
    throw new Error('Invalid quorum configuration: expected numeric k and n values');
  }
  return {
    k: quorum.k,
    n: quorum.n,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeLatencyMs(sample: RawSample): number {
  if (typeof sample.latencyMs === 'number') {
    return sample.latencyMs;
  }
  const delta = Date.now() - sample.updatedAt.getTime();
  return delta < 0 ? 0 : delta;
}

function computeLatencyScore(latencyMs: number, ttlMs: number): number {
  if (!Number.isFinite(latencyMs) || latencyMs <= 0) {
    return 1;
  }
  const tolerance = Math.max(ttlMs * 2, 30_000);
  const ratio = clamp(latencyMs / tolerance, 0, 1.2);
  const score = 1 - ratio;
  return Number(clamp(score, 0.1, 1).toFixed(6));
}

function computeProviderScore(sample: RawSample): number {
  const confidenceInterval = sample.metadata?.confidenceInterval;
  if (sample.provider === 'pyth' && typeof confidenceInterval === 'number') {
    const adjusted = 1 - clamp(confidenceInterval, 0, 0.9);
    return Number(clamp(adjusted, 0.1, 1).toFixed(6));
  }
  if (typeof sample.metadata?.penalty === 'number') {
    return Number(clamp(sample.metadata.penalty, 0.1, 1).toFixed(6));
  }
  return 1;
}

function collectEvidence(samples: RawSample[]): Signal['evidence'] {
  const unique = new Map<string, Signal['evidence'][number]>();
  for (const sample of samples) {
    for (const evidence of sample.evidence ?? []) {
      const key = `${evidence.source_id}-${evidence.captured_at}-${evidence.hash ?? ''}`;
      if (!unique.has(key)) {
        unique.set(key, evidence);
      }
    }
  }
  return Array.from(unique.values());
}

export async function processPipeline(context: PipelineContext): Promise<Signal | null> {
  const { feed, samples } = context;
  if (!samples.length) {
    return null;
  }

  const ingestStart = performance.now();
  ingestTotal.inc({ source: 'shadow' });

  try {
    const consensusStart = performance.now();

    const augmented = samples.map(sample => {
      const latencyMs = computeLatencyMs(sample);
      const latencyScore = computeLatencyScore(latencyMs, feed.ttl_ms);
      const providerScore = computeProviderScore(sample);
      const quorumEligible = sample.quorumEligible !== false;
      const effectiveWeight = Math.max(
        0,
        sample.weight * sample.confidence * latencyScore * providerScore * (quorumEligible ? 1 : 0)
      );

      return {
        sample,
        latencyMs,
        latencyScore,
        providerScore,
        effectiveWeight,
      };
    });

    const quorumValues = augmented.map(
      entry => entry.sample.quorumEligible !== false && entry.sample.confidence >= 0.5
    );
    const quorum = ensureQuorumConfig(feed.quorum);
    const quorumOk = quorumSatisfied(quorumValues, quorum);
    const consensusMs = (performance.now() - consensusStart) / 1000;
    consensusLatency.observe(consensusMs);

    if (!quorumOk) {
      quorumFailTotal.inc({ feed: feed.id });
    }

    const weightedInputs = augmented.map(entry => ({
      value: entry.sample.value,
      weight: entry.effectiveWeight,
    }));

    const hasEffectiveWeights = weightedInputs.some(entry => entry.weight > 0);
    let consensusValue: number;
    if (hasEffectiveWeights) {
      const median = weightedMedian(weightedInputs);
      if (weightedInputs.length >= 3) {
        const trimmed = trimmedMean(weightedInputs);
        consensusValue = Number(((median + trimmed) / 2).toFixed(8));
      } else {
        consensusValue = Number(median.toFixed(8));
      }
    } else {
      consensusValue = samples.reduce((acc, sample) => acc + sample.value, 0) / samples.length;
    }

    const weightSum = augmented.reduce((acc, entry) => acc + entry.effectiveWeight, 0);
    const confidence = weightSum > 0
      ? augmented.reduce((acc, entry) => acc + entry.effectiveWeight * entry.sample.confidence, 0) /
        weightSum
      : samples.reduce((acc, sample) => acc + sample.confidence, 0) / samples.length;

    const rawSignal = normalizeSignal({
      id: `${feed.id}:${Date.now()}`,
      feedId: feed.id,
      ts: new Date(),
      value: consensusValue,
      unit: normalizeUnit(feed.unit),
      confidence: clamp(confidence, 0, 1),
      quorum_ok: quorumOk,
      stale: false,
      evidence: collectEvidence(samples),
      tags: feed.tags ?? [],
      rev: 0,
    });

    const digestMs = (performance.now() - ingestStart) / 1000;
    digestLatency.observe(digestMs);

    const quality = applyQualityGuards(rawSignal, feed.ttl_ms);

    const finalSignal: Signal = {
      ...rawSignal,
      confidence: quality.confidence,
      stale: quality.stale,
      rev: nextRevision(feed.id),
    };

    const previous = await fetchLatestSignal(feed.id);

    let guardrails = null as any;
    try {
      guardrails = await getGuardrails(feed.id, feed.category);
    } catch (e: any) {
      console.warn('oracle-pipeline: guardrails unavailable, proceeding without', e?.message || e);
      guardrails = null;
    }
    const dqResult = evaluateSignal(finalSignal, { feed, previous, guardrails });
    dqResult.checks.forEach(({ rule, passed }) =>
      dqEvaluationsTotal.inc({ feed: feed.id, rule: rule.id, outcome: passed ? 'pass' : 'fail' })
    );
    if (!dqResult.valid) {
      dqResult.failures.forEach(rule =>
        dqFailureTotal.inc({ feed: feed.id, rule: rule.id })
      );
      await quarantineSignal(finalSignal, {
        reason: 'dq_failure',
        ruleIds: dqResult.failures.map(rule => rule.id),
        metadata: {
          checks: dqResult.checks,
        },
      });
      return null;
    }

    if (isFeedQuarantined(feed.id)) {
      return null;
    }

    const shadowReference = await (feedPolicies.resolveShadowReference?.(feed));
    const breakerOutcome = await (feedPolicies.evaluateCircuitBreakers?.(
      feed,
      finalSignal.value,
      previous ? previous.value : null,
      finalSignal.confidence
    ) || Promise.resolve({ tripped: false }));
    if (breakerOutcome.tripped) {
      await quarantineSignal(finalSignal, {
        reason: 'circuit_breaker',
        ruleIds: breakerOutcome.reason ? [breakerOutcome.reason] : undefined,
        metadata: breakerOutcome,
      });
      return null;
    }

    const validation = validateSignal(finalSignal);
    if (!validation.valid) {
      return null;
    }

    if (previous && new Date(previous.ts).getTime() >= new Date(finalSignal.ts).getTime()) {
      finalSignal.ts = new Date(Date.now() + 1).toISOString();
    }

    await storeSignal(finalSignal);
    await appendSeries(finalSignal);
    await cacheSignal(`oracle:signal:${feed.id}:latest`, finalSignal, Math.ceil(feed.ttl_ms / 1000));
    recordProvenance(finalSignal);
    publishSignalUpdate(finalSignal);

    const reference = typeof shadowReference === 'number' ? shadowReference : previous?.value;
    updateShadowRmse(feed, finalSignal, reference ?? undefined);

    const baseline = resolveBaseline(feed.id);
    const rpcName = baseline?.rpc ?? 'mock-core';
    const averageLatency = augmented.length
      ? augmented.reduce((acc, entry) => acc + entry.latencyMs, 0) / augmented.length
      : consensusMs * 1000;
    updateRpcHeartbeat(feed.id, rpcName, averageLatency);

    signalsTotal.inc({ feed: feed.id });
    staleRatio.set({ feed: feed.id }, finalSignal.stale ? 1 : 0);

    return finalSignal;
  } catch (error) {
    ingestFailTotal.inc({ source: 'mock' });
    console.error('oracle-pipeline: failed', error);
    return null;
  }
}
