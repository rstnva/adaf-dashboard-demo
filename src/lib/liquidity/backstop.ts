// Liquidity Backstop: calcula reservas necesarias para absorber shocks
export interface LiquidityShockInput {
  desk: string;
  currentLiquidityUsd: number;
  peakOutflowUsd: number;
  volatilityIndex: number; // 0-100
}

export interface LiquidityBackstopPlan {
  status: 'simulated';
  desk: string;
  topUpUsd: number;
  reserveMultiplier: number;
  activationThresholdUsd: number;
}

export class LiquidityBackstopPlanner {
  static plan(input: LiquidityShockInput): LiquidityBackstopPlan {
    const stressFactor = 1 + input.volatilityIndex / 50;
    const requiredLiquidity = input.peakOutflowUsd * stressFactor;
    const topUpUsd = Math.max(requiredLiquidity - input.currentLiquidityUsd, 0);
    const reserveMultiplier = Number((requiredLiquidity / Math.max(input.currentLiquidityUsd, 1)).toFixed(2));

    return {
      status: 'simulated',
      desk: input.desk,
      topUpUsd,
      reserveMultiplier,
      activationThresholdUsd: Number((input.peakOutflowUsd * 0.9).toFixed(2)),
    };
  }
}
