// BlockBuilderSimulator: simula la construcción de bloques con prioridad institucional
export type BlockBuildRequest = {
  bundleId: string;
  transactions: number;
  expectedPayout: number;
  preferences?: {
    mevProtection?: boolean;
    maxLatencyMs?: number;
  };
};

export type BlockBuildResult = {
  status: 'simulated';
  bundleId: string;
  accepted: boolean;
  latencyMs: number;
  effectiveRebateBps: number;
};

export class BlockBuilderSimulator {
  static simulateBuild(request: BlockBuildRequest): BlockBuildResult {
    const volumeScore = Math.min(request.transactions / 100, 5);
    const payoutScore = request.expectedPayout > 50_000 ? 2 : 1;
    const mevPenalty = request.preferences?.mevProtection ? 0.5 : 0;

    const acceptanceScore = volumeScore + payoutScore - mevPenalty;
    const accepted = acceptanceScore >= 2.5;

    return {
      status: 'simulated',
      bundleId: request.bundleId,
      accepted,
      latencyMs: Math.max(40, 120 - volumeScore * 10),
      effectiveRebateBps: accepted ? 25 + payoutScore * 5 : 10,
    };
  }
}
