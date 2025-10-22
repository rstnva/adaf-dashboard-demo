import { describe, expect, it, beforeEach } from 'vitest';

import {
  checkRateLimit,
  enforceRateLimit,
  cleanupExpiredBuckets,
  RATE_LIMITS,
} from '../../services/oracle-core/acl/rate-limit';

describe('Oracle Rate Limiting', () => {
  beforeEach(() => {
    cleanupExpiredBuckets();
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit('client-A', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(5 - i - 1);
      }
    });

    it('blocks requests over limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 };
      
      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('client-B', config);
      }
      
      // Next request should be blocked
      const result = checkRateLimit('client-B', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('resets after window expires', () => {
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window
      
      // Exhaust limit
      checkRateLimit('client-C', config);
      checkRateLimit('client-C', config);
      
      let result = checkRateLimit('client-C', config);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          result = checkRateLimit('client-C', config);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });

    it('maintains separate buckets per key', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      checkRateLimit('client-D', config);
      checkRateLimit('client-D', config);
      
      const resultD = checkRateLimit('client-D', config);
      expect(resultD.allowed).toBe(false);
      
      const resultE = checkRateLimit('client-E', config);
      expect(resultE.allowed).toBe(true);
    });
  });

  describe('enforceRateLimit', () => {
    it('returns RateLimitResult when allowed', () => {
      const config = { maxRequests: 10, windowMs: 60000 };
      
      const result = enforceRateLimit('client-F', config);
      expect(result).not.toBeInstanceOf(Response);
      expect(result).toHaveProperty('allowed', true);
    });

    it('returns 429 Response when blocked', () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      
      enforceRateLimit('client-G', config); // First request
      const result = enforceRateLimit('client-G', config); // Second request
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(429);
    });

    it('includes rate limit headers in 429 response', async () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      
      enforceRateLimit('client-H', config);
      const result = enforceRateLimit('client-H', config) as Response;
      
      expect(result.headers.get('Retry-After')).toBeTruthy();
      expect(result.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('defines reader tier', () => {
      expect(RATE_LIMITS.reader.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMITS.reader.windowMs).toBeGreaterThan(0);
    });

    it('defines publisher tier', () => {
      expect(RATE_LIMITS.publisher.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMITS.publisher.windowMs).toBeGreaterThan(0);
    });

    it('defines admin tier with higher limits', () => {
      expect(RATE_LIMITS.admin.maxRequests).toBeGreaterThanOrEqual(RATE_LIMITS.reader.maxRequests);
      expect(RATE_LIMITS.admin.maxRequests).toBeGreaterThanOrEqual(RATE_LIMITS.publisher.maxRequests);
    });
  });
});
