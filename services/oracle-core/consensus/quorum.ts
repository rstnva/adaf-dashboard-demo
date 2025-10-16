export interface QuorumConfig {
  k: number;
  n: number;
}

export function quorumSatisfied(values: Array<boolean | number>, quorum: QuorumConfig): boolean {
  const successCount = values.reduce((acc, value) => acc + Number(value), 0);
  return successCount >= quorum.k && values.length >= quorum.n;
}
