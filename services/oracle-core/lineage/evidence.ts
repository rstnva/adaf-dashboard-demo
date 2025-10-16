import type { EvidenceRef } from '../registry/schema';

export function createMockEvidence(sourceId: string): EvidenceRef {
  const timestamp = new Date().toISOString();
  return {
    source_id: sourceId,
    captured_at: timestamp,
  };
}
