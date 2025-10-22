export interface WeightedSample {
  value: number;
  weight: number;
}

export function weightedMedian(samples: WeightedSample[]): number {
  if (!samples.length) {
    throw new Error('weightedMedian requires samples');
  }

  const sorted = [...samples].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((acc, sample) => acc + sample.weight, 0);
  const threshold = totalWeight / 2;

  let cumulative = 0;
  for (const sample of sorted) {
    cumulative += sample.weight;
    if (cumulative >= threshold) {
      return sample.value;
    }
  }

  return sorted[sorted.length - 1]?.value ?? 0;
}

export function trimmedMean(samples: WeightedSample[], trimRatio = 0.1): number {
  if (!samples.length) {
    throw new Error('trimmedMean requires samples');
  }

  const sorted = [...samples].sort((a, b) => a.value - b.value);
  const trimCount = Math.floor(sorted.length * trimRatio);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  const numerator = trimmed.reduce((acc, sample) => acc + sample.value * sample.weight, 0);
  const denominator = trimmed.reduce((acc, sample) => acc + sample.weight, 0);

  return denominator === 0 ? 0 : numerator / denominator;
}
