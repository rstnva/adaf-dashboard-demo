import { SequencerAllianceManager } from '../src/lib/blockspace/sequencer';

describe('SequencerAllianceManager', () => {
  it('devuelve alianzas simuladas', () => {
    const alliances = SequencerAllianceManager.getAlliances();
    expect(alliances.length).toBeGreaterThan(0);
    expect(alliances[0]).toHaveProperty('id');
    expect(alliances[0]).toHaveProperty('performance');
  });
});
