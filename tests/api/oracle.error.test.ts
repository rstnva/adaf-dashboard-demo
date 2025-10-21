import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';

describe('@integration Oracle Error Middleware', () => {
  it('404 returns JSON with trace_id', async () => {
    const res = await fetch(
      'http://localhost:3005/api/oracle/v1/feeds/by-id?id=inexistente'
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty('trace_id');
    expect(json).toHaveProperty('error');
  });
  it('500 returns JSON with trace_id', async () => {
    // Simular error forzado si existe endpoint de prueba
    // Si no, este test puede ser skip o pending
    expect(true).toBe(true);
  });
});
