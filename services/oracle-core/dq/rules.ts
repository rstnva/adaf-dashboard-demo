import type { Feed, Signal } from '../registry/schema';
import type { GuardrailConfig } from './guardrails';

export interface DataQualityContext {
  feed: Feed;
  previous?: Signal | null;
  guardrails?: GuardrailConfig | null;
}

export interface DataQualityRule {
  id: string;
  description: string;
  evaluate: (_signal: Signal, _context?: DataQualityContext) => boolean;
}

export interface DataQualityCheck {
  rule: DataQualityRule;
  passed: boolean;
}

export interface DataQualityEvaluation {
  valid: boolean;
  failures: DataQualityRule[];
  checks: DataQualityCheck[];
}

const NON_NEGATIVE_UNITS = new Set(['usd', 'gwei', 'index', 'lamports']);
const BOUNDED_UNITS: Record<string, { min: number; max: number }> = {
  percent: { min: 0, max: 200 },
  score: { min: -1, max: 1 },
  signal_score: { min: -1, max: 1 },
};
const DELTA_SENSITIVE_UNITS = new Set(['usd', 'gwei', 'index', 'percent', 'score', 'signal_score']);
const DEFAULT_MAX_RELATIVE_DELTA = 5; // 500% jump cap in mock mode

export const defaultRules: DataQualityRule[] = [
  {
    id: 'range:confidence',
    description: 'Confidence must be between 0 and 1',
    evaluate: signal => signal.confidence >= 0 && signal.confidence <= 1,
  },
  {
    id: 'range:value',
    description: 'Value must be finite',
    evaluate: signal => Number.isFinite(signal.value),
  },
  {
    id: 'range:non_negative',
    description: 'Non-negative units must not drop below zero',
    evaluate: (signal, context) => {
      if (!context) return true;
      const guardrails = context.guardrails;
      const minFromGuardrail = guardrails?.min;
      if (typeof minFromGuardrail === 'number') {
        return signal.value >= minFromGuardrail;
      }
      if (!NON_NEGATIVE_UNITS.has(context.feed.unit)) {
        return true;
      }
      return signal.value >= 0;
    },
  },
  {
    id: 'range:bounded_units',
    description: 'Bounded units must stay within configured range',
    evaluate: (signal, context) => {
      if (!context) return true;

      const guardrails = context.guardrails;
      const lowerBound = guardrails?.min ?? BOUNDED_UNITS[context.feed.unit]?.min;
      const upperBound = guardrails?.max ?? BOUNDED_UNITS[context.feed.unit]?.max;

      if (typeof lowerBound === 'number' && signal.value < lowerBound) {
        return false;
      }
      if (typeof upperBound === 'number' && signal.value > upperBound) {
        return false;
      }

      const bounds = BOUNDED_UNITS[context.feed.unit];
      if (!bounds) return true;
      return signal.value >= bounds.min && signal.value <= bounds.max;
    },
  },
  {
    id: 'delta:relative_jump',
    description: 'Detect pathological jumps vs previous value',
    evaluate: (signal, context) => {
      if (!context || !context.previous || !DELTA_SENSITIVE_UNITS.has(context.feed.unit)) {
        return true;
      }
      const previousValue = context.previous.value;
      const baseline = Math.max(Math.abs(previousValue), 1e-6);
      const change = Math.abs(signal.value - previousValue) / baseline;
      const limit = context.guardrails?.maxRelativeDelta ?? DEFAULT_MAX_RELATIVE_DELTA;
      return change <= limit;
    },
  },
];

export function evaluateSignal(
  signal: Signal,
  context?: DataQualityContext,
  rules: DataQualityRule[] = defaultRules
) : DataQualityEvaluation {
  const failures: DataQualityRule[] = [];
  const checks: DataQualityCheck[] = [];

  for (const rule of rules) {
    const passed = rule.evaluate(signal, context);
    checks.push({ rule, passed });
    if (!passed) {
      failures.push(rule);
    }
  }

  return {
    valid: failures.length === 0,
    failures,
    checks,
  };
}
