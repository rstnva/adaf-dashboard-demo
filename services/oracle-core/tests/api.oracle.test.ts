import { describe, it, expect } from 'vitest';
import supertest from 'supertest';

const api = supertest('http://localhost:3005');

describe('Oracle API', () => {
  it('GET /api/oracle/v1/feeds returns ≥ 30 feeds', async () => {
    const res = await api.get('/api/oracle/v1/feeds');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(30);
  });

  it('GET /api/oracle/v1/feeds/by-id?id=wsp/indices/vix_index returns feed', async () => {
    const res = await api.get('/api/oracle/v1/feeds/by-id?id=wsp/indices/vix_index');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'wsp/indices/vix_index');
    expect(res.body).toHaveProperty('stale');
    expect(res.body).toHaveProperty('quorum_ok');
    expect(res.body).toHaveProperty('confidence');
  });

  it('GET /api/oracle/v1/feeds/by-id/latest?id=wsp/indices/vix_index returns latest', async () => {
    const res = await api.get('/api/oracle/v1/feeds/by-id/latest?id=wsp/indices/vix_index');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'wsp/indices/vix_index');
    expect(res.body).toHaveProperty('value');
    expect(res.body).toHaveProperty('confidence');
  });

  it('GET /api/oracle/v1/feeds/by-id?id=inexistente returns 404 JSON error', async () => {
    const res = await api.get('/api/oracle/v1/feeds/by-id?id=inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  // Note: Pretty-path requires Next.js middleware (port 3000), not available in unit test context (port 3005)
  it.skip('GET /api/oracle/v1/feeds/id/wsp/indices/vix_index (pretty) returns feed', async () => {
    const res = await api.get('/api/oracle/v1/feeds/id/wsp/indices/vix_index');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'wsp/indices/vix_index');
  });
});
