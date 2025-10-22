import type { EvidenceRef, Signal } from '../registry/schema';

const provenanceIndex = new Map<string, EvidenceRef[]>();

export function recordProvenance(signal: Signal) {
  provenanceIndex.set(signal.id, signal.evidence);
}

export function getProvenance(signalId: string): EvidenceRef[] {
  return provenanceIndex.get(signalId) ?? [];
}
