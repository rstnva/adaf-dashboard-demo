import type { Signal } from '../registry/schema';

const signalsByFeed = new Map<string, Signal[]>();

export async function storeSignal(signal: Signal): Promise<void> {
  const existing = signalsByFeed.get(signal.feedId) ?? [];
  const updated = [...existing.filter(entry => entry.id !== signal.id), signal];
  updated.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  signalsByFeed.set(signal.feedId, updated.slice(0, 500));
}

export async function fetchLatestSignal(feedId: string): Promise<Signal | undefined> {
  const entries = signalsByFeed.get(feedId);
  return entries ? entries[0] : undefined;
}

export async function querySignals(
  feedIds: string[],
  since?: string,
  until?: string
): Promise<Record<string, Signal[]>> {
  const start = since ? new Date(since).getTime() : Number.NEGATIVE_INFINITY;
  const end = until ? new Date(until).getTime() : Number.POSITIVE_INFINITY;

  return feedIds.reduce<Record<string, Signal[]>>((acc, feedId) => {
    const entries = signalsByFeed.get(feedId) ?? [];
    acc[feedId] = entries.filter(entry => {
      const timestamp = new Date(entry.ts).getTime();
      return timestamp >= start && timestamp <= end;
    });
    return acc;
  }, {});
}

export async function listFeedsWithSignals(): Promise<string[]> {
  return Array.from(signalsByFeed.keys());
}
