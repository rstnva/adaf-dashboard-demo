import { describe, it, expect } from 'vitest';

const BASE = 'http://localhost:3000/api/blockspace';

// Nota: El servidor Next.js debe estar corriendo en paralelo para estas pruebas

describe('Blockspace API (Next.js routes)', () => {
  it('POST /routes simula relay', async () => {
    const res = await fetch(`${BASE}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txs: ['0xabc'], meta: { user: 'demo' } })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('simulated');
    expect(data.bundleId).toBe('mock-bundle-001');
  });

  it('POST /rebates simula rebate', async () => {
    const res = await fetch(`${BASE}/rebates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: 1000000 })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('rebate');
  });

  it('GET /sequencer simula alianzas', async () => {
    const res = await fetch(`${BASE}/sequencer`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('alliances');
    expect(Array.isArray(data.alliances)).toBe(true);
  });
});
