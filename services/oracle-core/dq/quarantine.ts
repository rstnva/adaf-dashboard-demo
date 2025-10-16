import type { Signal } from '../registry/schema';

const quarantinedFeeds = new Map<string, { signal: Signal; reason: string; quarantinedAt: string }>();

export function quarantineSignal(signal: Signal, reason: string) {
  quarantinedFeeds.set(signal.feedId, {
    signal,
    reason,
    quarantinedAt: new Date().toISOString(),
  });
}

export function releaseFeed(feedId: string) {
  quarantinedFeeds.delete(feedId);
}

export function isFeedQuarantined(feedId: string): boolean {
  return quarantinedFeeds.has(feedId);
}

export function listQuarantinedFeeds() {
  return Array.from(quarantinedFeeds.entries()).map(([feedId, entry]) => ({
    feedId,
    ...entry,
  }));
}
