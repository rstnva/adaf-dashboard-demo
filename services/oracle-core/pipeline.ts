import { performance } from 'node:perf_hooks';

import { normalizeSignal } from './digest/normalize';
import { normalizeUnit } from './digest/units';
import { applyQualityGuards } from './digest/quality';
import { weightedMedian } from './consensus/aggregators';
import { quorumSatisfied } from './consensus/quorum';
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
import { evaluateCircuitBreakers, resolveShadowReference } from './registry/feed-policies';
import { updateRpcHeartbeat, resolveBaseline } from './monitoring/heartbeats';

export interface RawSample {
  value: number;
  weight: number;
  evidence: Signal['evidence'];
  confidence: number;
}

export interface PipelineContext {
  feed: Feed;
  samples: RawSample[];
}

export async function processPipeline(context: PipelineContext): Promise<Signal | null> {
  const { feed, samples } = context;
  if (!samples.length) {
    return null;
  }

  const ingestStart = performance.now();
  ingestTotal.inc({ source: 'mock' });

  try {
    const median = weightedMedian(samples.map(({ value, weight }) => ({ value, weight })));
    const consensusStart = performance.now();

    const quorumValues = samples.map(sample => sample.confidence >= 0.5);
    const quorumOk = quorumSatisfied(quorumValues, feed.quorum);
    const consensusMs = (performance.now() - consensusStart) / 1000;
    consensusLatency.observe(consensusMs);

    if (!quorumOk) {
      quorumFailTotal.inc({ feed: feed.id });
    }

    const confidence = Math.max(
      0,
      Math.min(
        1,
        samples.reduce((acc, sample) => acc + sample.confidence * sample.weight, 0) /
          samples.reduce((acc, sample) => acc + sample.weight, 0)
      )
    );

    const rawSignal = normalizeSignal({
      id: `${feed.id}:${Date.now()}`,
      feedId: feed.id,
      ts: new Date(),
      value: median,
      unit: normalizeUnit(feed.unit),
      confidence,
      quorum_ok: quorumOk,
      stale: false,
      evidence: samples[0]?.evidence ?? [],
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

    const guardrails = await getGuardrails(feed.id, feed.category);
    const dqResult = evaluateSignal(finalSignal, { feed, previous, guardrails });
    dqResult.checks.forEach(({ rule, passed }) =>
      dqEvaluationsTotal.inc({ feed: feed.id, rule: rule.id, outcome: passed ? 'pass' : 'fail' })
    );
    if (!dqResult.valid) {
      dqResult.failures.forEach(rule =>
        dqFailureTotal.inc({ feed: feed.id, rule: rule.id })
      );
      quarantineSignal(finalSignal, dqResult.failures.map(rule => rule.id).join(','));
      return null;
    }

    if (isFeedQuarantined(feed.id)) {
      return null;
    }

    const shadowReference = await resolveShadowReference(feed);
    const breakerOutcome = await evaluateCircuitBreakers(
      feed,
      finalSignal.value,
      previous ? previous.value : null,
      finalSignal.confidence
    );
    if (breakerOutcome.tripped) {
      quarantineSignal(finalSignal, `circuit_breaker:${breakerOutcome.reason ?? 'unknown'}`);
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
  updateRpcHeartbeat(feed.id, rpcName, consensusMs * 1000);

    signalsTotal.inc({ feed: feed.id });
    staleRatio.set({ feed: feed.id }, finalSignal.stale ? 1 : 0);

    return finalSignal;
  } catch (error) {
    ingestFailTotal.inc({ source: 'mock' });
    console.error('oracle-pipeline: failed', error);
    return null;
  }
}
