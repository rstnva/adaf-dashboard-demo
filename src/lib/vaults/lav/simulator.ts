// LAV Vault Simulator: escenario sim-only para vaults institucionales
export interface VaultRiskProfile {
  id: string;
  name: string;
  targetReturnBps: number;
  maxDrawdownBps: number;
  liquidityBand: 'daily' | 'weekly' | 'monthly';
}

export interface VaultSimulationInput {
  depositUsd: number;
  tenorDays: number;
  riskProfile: VaultRiskProfile;
}

export interface VaultSimulationResult {
  status: 'simulated';
  navProjection: number[];
  projectedReturnBps: number;
  stressLossBps: number;
  sharpeEstimate: number;
}

export class LavVaultSimulator {
  static simulate(input: VaultSimulationInput): VaultSimulationResult {
    const days = Math.max(input.tenorDays, 7);
    const projectedReturnBps = Math.min(
      input.riskProfile.targetReturnBps,
      input.riskProfile.maxDrawdownBps + 400
    );
    const stressLossBps = Math.min(
      input.riskProfile.maxDrawdownBps,
      projectedReturnBps * 0.6
    );

    const navProjection = Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const drift = (projectedReturnBps / 10_000 / days) * day * input.depositUsd;
      const stress = (stressLossBps / 10_000) * input.depositUsd * Math.sin(day / 7);
      return Math.max(input.depositUsd + drift - stress, 0);
    });

    return {
      status: 'simulated',
      navProjection,
      projectedReturnBps,
      stressLossBps,
      sharpeEstimate: Number(((projectedReturnBps - stressLossBps) / 100).toFixed(2)),
    };
  }
}
