// Alpha Factory 2.0: generador de señales con moat institucional (sim-only)
export type AlphaSignal = {
  id: string;
  label: string;
  conviction: number; // 0-1
  expectedSharpRatio: number;
  horizonDays: number;
  tags: string[];
};

export class AlphaFactory {
  static generateSignals(universe: string[]): AlphaSignal[] {
    return universe.slice(0, 5).map((asset, index) => {
      const conviction = 0.4 + (index % 3) * 0.18;
      return {
        id: `alpha-${asset}-${index}`,
        label: `Alpha ${asset.toUpperCase()}`,
        conviction: Number(conviction.toFixed(2)),
        expectedSharpRatio: Number((1.1 - index * 0.1).toFixed(2)),
        horizonDays: 7 + index * 3,
        tags: ['quant', 'factor', index % 2 === 0 ? 'momentum' : 'mean-reversion'],
      };
    });
  }
}
