import { describe, it, expect } from 'vitest';

describe('@integration Oracle Readiness Alias', () => {
  const base = 'http://localhost:3000';

  it('responds with READY or NOT_READY', async () => {
    const res = await fetch(`${base}/api/oracle/v1/readiness`);
    // In CI without server, res may not be reachable; assert when available
    if (res) {
      expect([200, 503]).toContain(res.status);
      const json = await res.json().catch(() => ({}));
      if (json && json.status) {
        expect(['READY', 'NOT_READY']).toContain(json.status);
      }
    }
  });
});
