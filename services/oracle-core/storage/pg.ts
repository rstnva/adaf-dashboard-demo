import { Prisma, PrismaClient } from '@prisma/client';

import type { Signal, EvidenceRef } from '../registry/schema';

type OracleSignalRow = Prisma.OracleSignalGetPayload<{ include: { evidence: true } }> & {
  externalId?: string | null;
  tags?: string[] | null;
};

type OracleEvidenceRow = Prisma.OracleEvidenceGetPayload<{
  select: {
    sourceId: true;
    provider: true;
    capturedAt: true;
    payload: true;
    roundId: true;
    blockNumber: true;
    blockHash: true;
    transaction: true;
  };
}>;

let prismaSingleton: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaSingleton;
}

export function getOraclePrisma(): PrismaClient {
  return getPrismaClient();
}

function ensureDate(input: string): Date {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${input}`);
  }
  return date;
}

function mapEvidence(row: OracleEvidenceRow): EvidenceRef {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const url = typeof payload.url === 'string' ? payload.url : undefined;
  const hash = typeof payload.hash === 'string' ? payload.hash : undefined;
  const priceId = typeof payload.price_id === 'string' ? payload.price_id : undefined;
  const roundId = typeof payload.round_id === 'string' ? payload.round_id : row.roundId ?? undefined;
  const blockHash = row.blockHash ?? (typeof payload.block_hash === 'string' ? payload.block_hash : undefined);
  const blockNumber = row.blockNumber !== null && row.blockNumber !== undefined
    ? Number(row.blockNumber)
    : typeof payload.block_number === 'number'
      ? payload.block_number
      : undefined;

  return {
    source_id: row.sourceId,
    url,
    hash,
    price_id: priceId,
    round_id: roundId,
    block_hash: blockHash,
    block_number: blockNumber,
    captured_at: row.capturedAt.toISOString(),
  };
}

function mapSignal(row: OracleSignalRow): Signal {
  return {
    id: row.externalId ?? `${row.feedId}:${row.ts.toISOString()}`,
    feedId: row.feedId,
    ts: row.ts.toISOString(),
    value: Number(row.value),
    unit: row.unit,
    confidence: row.confidence,
    quorum_ok: row.quorumOk,
    stale: row.stale,
    evidence: row.evidence.map(mapEvidence),
    tags: row.tags ?? [],
    rev: row.rev,
  };
}

export async function storeSignal(signal: Signal): Promise<void> {
  const prisma = getPrismaClient();
  const timestamp = ensureDate(signal.ts);
  const evidence = signal.evidence ?? [];

  await prisma.$transaction(async tx => {
    await tx.oracleSignal.upsert({
      where: {
        feedId_ts: {
          feedId: signal.feedId,
          ts: timestamp,
        },
      },
      update: {
        externalId: signal.id,
        value: new Prisma.Decimal(signal.value),
        unit: signal.unit,
        confidence: signal.confidence,
        quorumOk: signal.quorum_ok,
        stale: signal.stale,
        sourceCount: evidence.length,
        rev: signal.rev,
        tags: signal.tags ?? [],
        status: signal.stale ? 'stale' : 'ok',
      } as unknown as Prisma.OracleSignalUncheckedUpdateInput,
      create: {
        externalId: signal.id,
        feedId: signal.feedId,
        ts: timestamp,
        value: new Prisma.Decimal(signal.value),
        unit: signal.unit,
        confidence: signal.confidence,
        quorumOk: signal.quorum_ok,
        stale: signal.stale,
        sourceCount: evidence.length,
        rev: signal.rev,
        tags: signal.tags ?? [],
        status: signal.stale ? 'stale' : 'ok',
      } as unknown as Prisma.OracleSignalUncheckedCreateInput,
    });

    await tx.oracleEvidence.deleteMany({
      where: {
        feedId: signal.feedId,
        ts: timestamp,
      },
    });

    if (evidence.length) {
      await tx.oracleEvidence.createMany({
        data: evidence.map(item => ({
          feedId: signal.feedId,
          ts: timestamp,
          sourceId: item.source_id,
          provider: item.source_id,
          roundId: item.round_id,
          blockNumber: typeof item.block_number === 'number' ? BigInt(item.block_number) : undefined,
          blockHash: item.block_hash,
          transaction: item.hash,
          payload: {
            url: item.url,
            hash: item.hash,
            price_id: item.price_id,
            round_id: item.round_id,
            block_hash: item.block_hash,
            block_number: item.block_number,
          },
          capturedAt: ensureDate(item.captured_at),
        })),
      });
    }
  });
}

export async function fetchLatestSignal(feedId: string): Promise<Signal | undefined> {
  const prisma = getPrismaClient();
  const row = await prisma.oracleSignal.findFirst({
    where: { feedId },
    orderBy: { ts: 'desc' },
    include: { evidence: true },
  });

  return row ? mapSignal(row) : undefined;
}

export async function querySignals(
  feedIds: string[],
  since?: string,
  until?: string
): Promise<Record<string, Signal[]>> {
  const prisma = getPrismaClient();
  const where: Prisma.OracleSignalWhereInput = {
    feedId: { in: feedIds },
  };

  if (since || until) {
    where.ts = {};
    if (since) {
      where.ts.gte = ensureDate(since);
    }
    if (until) {
      where.ts.lte = ensureDate(until);
    }
  }

  const rows = await prisma.oracleSignal.findMany({
    where,
    orderBy: { ts: 'desc' },
    include: { evidence: true },
  });

  return feedIds.reduce<Record<string, Signal[]>>((acc, feedId) => {
    const slice = rows.filter(row => row.feedId === feedId).map(mapSignal);
    acc[feedId] = slice;
    return acc;
  }, {});
}

export async function listFeedsWithSignals(): Promise<string[]> {
  const prisma = getPrismaClient();
  const rows = await prisma.oracleSignal.findMany({
    distinct: ['feedId'],
    orderBy: { feedId: 'asc' },
    select: { feedId: true },
  });

  return rows.map(row => row.feedId);
}
