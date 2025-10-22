import type { Signal } from '../registry/schema';

const series = new Map<string, Signal[]>();

export async function appendSeries(signal: Signal) {
  const existing = series.get(signal.feedId) ?? [];
  existing.push(signal);
  series.set(signal.feedId, existing);
}

export async function getSeries(feedId: string): Promise<Signal[]> {
  return series.get(feedId) ?? [];
}
