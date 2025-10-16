// Transaction Cost Analyzer: compara rutas y costos esperados
export interface TcaInput {
  orderId: string;
  notionalUsd: number;
  avgDailyVolumeUsd: number;
  urgency: 'low' | 'medium' | 'high';
  venues: string[];
}

export interface TcaBreakdown {
  status: 'simulated';
  orderId: string;
  expectedSlippageBps: number;
  venueComparisons: Array<{
    venue: string;
    impactBps: number;
    estimatedCompletionMinutes: number;
  }>;
}

export class TcaAnalyzer {
  static analyze(input: TcaInput): TcaBreakdown {
    const liquidityRatio = input.notionalUsd / Math.max(input.avgDailyVolumeUsd, 1);
    const urgencyMultiplier = input.urgency === 'high' ? 1.5 : input.urgency === 'medium' ? 1.1 : 0.8;
    const baseSlippage = Number((liquidityRatio * 10 * urgencyMultiplier).toFixed(2));

    return {
      status: 'simulated',
      orderId: input.orderId,
      expectedSlippageBps: baseSlippage,
      venueComparisons: input.venues.map((venue, index) => ({
        venue,
        impactBps: Number((baseSlippage + index * 0.8).toFixed(2)),
        estimatedCompletionMinutes: Math.max(5, 15 - index * 2),
      })),
    };
  }
}
