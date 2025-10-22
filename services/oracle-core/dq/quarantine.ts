import type { Signal } from '../registry/schema';
import { getOraclePrisma } from '../storage/pg';

const quarantinedFeeds = new Map<string, QuarantineEntry>();

export interface QuarantineDetails {
  reason: string;
  ruleIds?: string[];
  zScore?: number;
  disputeRef?: string;
  metadata?: Record<string, unknown>;
}

interface QuarantineEntry {
  signal: Signal;
  details: QuarantineDetails;
  quarantinedAt: string;
}

function buildQuarantineId(signal: Signal): string {
  return `${signal.feedId}:${signal.ts}:rev${signal.rev}`;
}

export async function quarantineSignal(signal: Signal, details: QuarantineDetails): Promise<void> {
  const entry: QuarantineEntry = {
    signal,
    details,
    quarantinedAt: new Date().toISOString(),
  };
  quarantinedFeeds.set(signal.feedId, entry);

  const prisma = getOraclePrisma();
  const ruleId = details.ruleIds?.[0] ?? details.reason;
  const metadata = {
    ...details.metadata,
    ruleIds: details.ruleIds,
  };

  await prisma.quarantineEvent.upsert({
    where: { id: buildQuarantineId(signal) },
    update: {
      ruleId,
      reason: details.reason,
      zScore: details.zScore,
      disputeRef: details.disputeRef,
      metadata,
      status: 'open',
      resolvedAt: null,
    },
    create: {
      id: buildQuarantineId(signal),
      feedId: signal.feedId,
      ts: new Date(signal.ts),
      rev: signal.rev,
      ruleId,
      reason: details.reason,
      zScore: details.zScore,
      disputeRef: details.disputeRef,
      metadata,
      status: 'open',
    },
  });
}

export async function releaseFeed(feedId: string): Promise<void> {
  quarantinedFeeds.delete(feedId);

  const prisma = getOraclePrisma();
  await prisma.quarantineEvent.updateMany({
    where: {
      feedId,
      status: 'open',
    },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });
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
