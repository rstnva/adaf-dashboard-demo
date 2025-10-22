import type { Signal } from '../registry/schema';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validateSignal(signal: Signal): ValidationResult {
  const reasons: string[] = [];

  if (Number.isNaN(signal.value)) {
    reasons.push('value_nan');
  }

  if (signal.confidence < 0 || signal.confidence > 1) {
    reasons.push('confidence_out_of_range');
  }

  if (!signal.evidence.length) {
    reasons.push('missing_evidence');
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
