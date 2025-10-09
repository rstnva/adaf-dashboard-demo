// RebateCalculator: Simulación de cálculo de rebates dinámicos
export class RebateCalculator {
  static calculate(volume: number) {
    // Simula tiers y rebates
    if (volume > 1_000_000) return { tier: 'pro', rebate: 0.0025 };
    if (volume > 100_000) return { tier: 'plus', rebate: 0.001 };
    return { tier: 'basic', rebate: 0.0005 };
  }
}
