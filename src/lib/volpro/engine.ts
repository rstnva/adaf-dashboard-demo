// Volatility Pro Engine: genera escenarios de volatilidad con cobertura dinámica
export interface VolScenarioInput {
  asset: string;
  realizedVol: number; // % anualizada
  impliedVol: number; // % anualizada
  hedgeBudgetBps: number;
}

export interface VolScenarioResult {
  status: 'simulated';
  asset: string;
  skew: number;
  hedgeNotionalUsd: number;
  recommendedStructure: 'collar' | 'put-spread' | 'calendar' | 'covered-call';
}

const STRUCTURES: VolScenarioResult['recommendedStructure'][] = [
  'collar',
  'put-spread',
  'calendar',
  'covered-call',
];

export class VolProEngine {
  static simulate(input: VolScenarioInput): VolScenarioResult {
    const { realizedVol, impliedVol, hedgeBudgetBps } = input;
    const skew = Number((impliedVol - realizedVol).toFixed(2));
    const structureIndex = Math.max(
      0,
      Math.min(
        STRUCTURES.length - 1,
        Math.round((skew + hedgeBudgetBps / 100) % STRUCTURES.length)
      )
    );

    return {
      status: 'simulated',
      asset: input.asset,
      skew,
      hedgeNotionalUsd: Number((hedgeBudgetBps * 10_000).toFixed(2)),
      recommendedStructure: STRUCTURES[structureIndex],
    };
  }
}
