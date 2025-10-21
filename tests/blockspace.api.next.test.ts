import { describe, it, expect } from 'vitest';

import { POST as relayRoute } from '../src/app/api/blockspace/routes/route';
import { POST as rebatesRoute } from '../src/app/api/blockspace/rebates/route';
import { GET as sequencerRoute } from '../src/app/api/blockspace/sequencer/route';

const jsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

describe('Blockspace API (Next.js routes)', () => {
  it('POST /routes simula relay', async () => {
    const res = await relayRoute(
      jsonRequest('http://localhost/api/blockspace/routes', {
        txs: ['0xabc'],
        meta: { user: 'demo' }
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('simulated');
    expect(data.bundleId).toBe('mock-bundle-001');
  });

  it('POST /rebates simula rebate', async () => {
    const res = await rebatesRoute(
      jsonRequest('http://localhost/api/blockspace/rebates', {
        volume: 1_000_000
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('rebate');
  });

  it('GET /sequencer simula alianzas', async () => {
    const res = await sequencerRoute();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('alliances');
    expect(Array.isArray(data.alliances)).toBe(true);
  });
});
