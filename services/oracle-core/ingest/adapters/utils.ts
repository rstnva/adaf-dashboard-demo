import type { EvidenceRef } from '../../registry/schema';
import type { RawSample } from '../../pipeline';
import type { AdapterFixture } from './fixtures';
import type { AdapterRequest } from './types';

export function fixtureToSample(
  provider: string,
  request: AdapterRequest,
  fixture: AdapterFixture
): RawSample {
  const updatedAt = new Date(fixture.updatedAt);
  const latencyMs = typeof fixture.latencyMs === 'number'
    ? fixture.latencyMs
    : Math.max(0, request.now.getTime() - updatedAt.getTime());
  const heartbeatMs = request.feed.ttl_ms;
  const withinHeartbeat = latencyMs <= heartbeatMs * 2;

  const evidence: EvidenceRef = {
    source_id: request.sourceId,
    captured_at: request.now.toISOString(),
  };

  if (fixture.txHash) {
    evidence.hash = fixture.txHash;
  }
  if (fixture.blockHash) {
    evidence.block_hash = fixture.blockHash;
  }
  if (typeof fixture.blockNumber === 'number') {
    evidence.block_number = fixture.blockNumber;
  }
  if (fixture.roundId) {
    evidence.round_id = fixture.roundId;
  }
  if (fixture.priceId) {
    evidence.price_id = fixture.priceId;
  }

  const metadata = {
    confidenceInterval: fixture.confidenceInterval,
    referenceId: fixture.priceId ?? fixture.roundId,
    validatorCount: fixture.validatorCount,
    deviationBps: fixture.deviationBps,
    disputeBond: fixture.disputeBond,
    penalty: fixture.penalty,
    heartbeatMs,
  };

  return {
    value: fixture.value,
    weight: request.weight,
    confidence: fixture.confidence ?? 0.9,
    provider,
    sourceId: request.sourceId,
    updatedAt,
    latencyMs,
    quorumEligible: fixture.quorumEligible ?? withinHeartbeat,
    evidence: [evidence],
    metadata,
  };
}
