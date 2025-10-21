import { describe, expect, it } from 'vitest';

import { checkRateLimit } from '../../../acl/rate-limit';

describe('Oracle Rate Limiting', () => {
  const config = { maxRequests: 100, windowMs: 60_000 };

  it('allows requests within limit', () => {
    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit('test-key', config);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests exceeding limit', () => {
    const key = 'abuse-key';
    
    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      checkRateLimit(key, config);
    }
    
    // Next request should be blocked
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different keys independently', () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit('key-a', config);
      checkRateLimit('key-b', config);
    }
    
    const resultA = checkRateLimit('key-a', config);
    const resultB = checkRateLimit('key-b', config);
    
    expect(resultA.allowed).toBe(true);
    expect(resultB.allowed).toBe(true);
  });
});
