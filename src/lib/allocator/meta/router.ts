// MetaAllocator: asigna capital a señales simuladas con constraints Fortune 500
export interface AllocationConstraint {
  id: string;
  maxExposureBps: number;
  minSharpe: number;
  cooldownDays: number;
}

export interface AllocationCandidate {
  signalId: string;
  sharpe: number;
  conviction: number;
  capitalSuggestedUsd: number;
}

export interface AllocationDecision {
  status: 'simulated';
  capitalAllocatedUsd: number;
  reason: string;
  constraintBreaches: string[];
}

export class MetaAllocator {
  static allocate(
    capitalUsd: number,
    candidate: AllocationCandidate,
    constraints: AllocationConstraint[]
  ): AllocationDecision {
    const breaches = constraints.filter(
      constraint =>
        candidate.capitalSuggestedUsd >
          (capitalUsd * constraint.maxExposureBps) / 10_000 ||
        candidate.sharpe < constraint.minSharpe
    );

    const capitalAllocatedUsd = breaches.length
      ? 0
      : Math.min(candidate.capitalSuggestedUsd, capitalUsd * 0.4);

    return {
      status: 'simulated',
      capitalAllocatedUsd,
      reason: breaches.length
        ? 'Capital bloqueado por constraints de riesgo'
        : 'Asignación priorizada con control de exposición',
      constraintBreaches: breaches.map(breach => breach.id),
    };
  }
}
