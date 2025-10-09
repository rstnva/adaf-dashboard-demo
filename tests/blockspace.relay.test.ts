import { BlockspaceRelayService } from '../src/lib/blockspace/relays';

describe('BlockspaceRelayService', () => {
  it('simula el relay de un bundle', () => {
    const bundle = { txs: ['0xabc'], meta: { user: 'demo' } };
    const result = BlockspaceRelayService.simulateRelay(bundle);
    expect(result.status).toBe('simulated');
    expect(result.bundleId).toBe('mock-bundle-001');
    expect(result.received).toBe(true);
    expect(result.txs).toEqual(['0xabc']);
  });
});
