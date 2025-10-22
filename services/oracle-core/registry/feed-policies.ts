import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Feed } from './schema';
import { estimateBaselineValue } from './feed-baseline';

export interface FeedAclPolicy {
  allow?: string[];
  deny?: string[];
}

export interface FeedCircuitBreakerPolicy {
  maxDeltaPct?: number;
  maxAbsolute?: number;
  minConfidence?: number;
}

export interface FeedShadowPolicy {
  provider: 'dia' | 'mock';
  mode: 'shadow' | 'mixed';
  reference?: number;
}

export interface FeedPolicy {
  acl?: FeedAclPolicy;
  circuitBreaker?: FeedCircuitBreakerPolicy;
  shadow?: FeedShadowPolicy;
}

interface FeedPoliciesDocument {
  defaults?: FeedPolicy;
  feeds: Record<string, FeedPolicy>;
}

let cache: FeedPoliciesDocument | null = null;

const POLICIES_FILE = path.join(
  process.cwd(),
  'services',
  'oracle-core',
  'registry',
  'feed-policies.json'
);

async function loadPolicies(): Promise<FeedPoliciesDocument> {
  if (cache) {
    return cache;
  }

  const raw = await readFile(POLICIES_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as FeedPoliciesDocument;
  cache = parsed;
  return parsed;
}

export function clearFeedPoliciesCache() {
  cache = null;
}

export async function getFeedPolicy(feed: Feed): Promise<FeedPolicy | undefined> {
  const policies = await loadPolicies();
  if (!policies) return undefined;

  const defaults = policies.defaults ?? {};
  const specific = policies.feeds?.[feed.id] ?? {};

  return {
    acl: {
      ...(defaults.acl ?? {}),
      ...(specific.acl ?? {}),
    },
    circuitBreaker: {
      ...(defaults.circuitBreaker ?? {}),
      ...(specific.circuitBreaker ?? {}),
    },
    shadow: specific.shadow ?? defaults.shadow,
  };
}

export async function ensurePublisherAllowed(feed: Feed, subject: string | null) {
  const policy = await getFeedPolicy(feed);
  const acl = policy?.acl;
  if (acl?.deny?.length && subject && acl.deny.includes(subject)) {
    throwForbidden(feed.id, subject, 'deny');
  }
  if (acl?.allow?.length && (!subject || !acl.allow.includes(subject))) {
    throwForbidden(feed.id, subject ?? 'anonymous', 'allow');
  }
}

function throwForbidden(feedId: string, subject: string, reason: 'allow' | 'deny'): never {
  const error = new Error(
    reason === 'allow'
      ? `publisher ${subject} is not allowed to publish feed ${feedId}`
      : `publisher ${subject} is denied for feed ${feedId}`
  );
  (error as any).statusCode = 403;
  throw error;
}

export async function evaluateCircuitBreakers(feed: Feed, value: number, previousValue: number | null, confidence: number): Promise<{ tripped: boolean; reason?: string }> {
  const policy = await getFeedPolicy(feed);
  const breaker = policy?.circuitBreaker;
  if (!breaker) {
    return { tripped: false };
  }

  if (typeof breaker.minConfidence === 'number' && confidence < breaker.minConfidence) {
    return {
      tripped: true,
      reason: `confidence ${confidence.toFixed(3)} < min ${breaker.minConfidence}`,
    };
  }

  if (typeof breaker.maxAbsolute === 'number') {
    const absolute = Math.abs(value);
    if (absolute > breaker.maxAbsolute) {
      return {
        tripped: true,
        reason: `abs(${absolute.toFixed(3)}) > maxAbsolute ${breaker.maxAbsolute}`,
      };
    }
  }

  if (
    typeof breaker.maxDeltaPct === 'number' &&
    previousValue !== null &&
    Math.abs(previousValue) > 0
  ) {
    const delta = Math.abs(value - previousValue);
    const ratio = delta / Math.abs(previousValue);
    if (ratio > breaker.maxDeltaPct) {
      return {
        tripped: true,
        reason: `delta ratio ${(ratio * 100).toFixed(2)}% > ${(breaker.maxDeltaPct * 100).toFixed(2)}%`,
      };
    }
  }

  return { tripped: false };
}

export async function resolveShadowReference(feed: Feed): Promise<number | undefined> {
  const policy = await getFeedPolicy(feed);
  if (!policy?.shadow) {
    return undefined;
  }

  if (policy.shadow.provider === 'dia') {
    const reference = policy.shadow.reference ?? estimateDiaBaseline(feed);
    return reference;
  }

  return undefined;
}

function estimateDiaBaseline(feed: Feed): number {
  // Simple heuristic: reuse baseline estimation with slight uplift to simulate DIA variance
  const baseline = estimateBaselineValue(feed) || 1;
  const hash = Array.from(feed.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variance = (hash % 7) * 0.01;
  const multiplier = feed.unit === 'usd' ? 1.02 : 1 + variance;
  return baseline * multiplier;
}
