/**
 * Rate limiter for Oracle API endpoints.
 * Uses in-memory sliding window (per client IP or token sub).
 * For production, migrate to Redis-backed rate limiter.
 */

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if request is within rate limit.
 * @param key - Unique identifier (IP, token sub, or combined)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  // Initialize or reset bucket if window expired
  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    buckets.set(key, bucket);
  }

  // Increment count
  bucket.count += 1;

  const allowed = bucket.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - bucket.count);

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/**
 * Periodic cleanup of expired buckets (call from cron or interval).
 */
export function cleanupExpiredBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Predefined rate limit tiers.
 */
export const RATE_LIMITS = {
  reader: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 req/min
  },
  publisher: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 req/min
  },
  admin: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 200 req/min
  },
} as const;

/**
 * Apply rate limit and return 429 Response if exceeded.
 */
export function enforceRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult | Response {
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        resetAt: new Date(result.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
        },
      }
    );
  }

  return result;
}
