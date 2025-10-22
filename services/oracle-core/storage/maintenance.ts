import type { PrismaClient } from '@prisma/client';

export interface OracleStorageMaintenanceOptions {
  logger?: Pick<typeof console, 'info' | 'warn' | 'error'>;
  signalsRetentionDays?: number;
  evidenceRetentionDays?: number;
  readStatsRetentionDays?: number;
  quarantineRetentionDays?: number;
  chunkIntervalDays?: number;
  readStatsChunkIntervalDays?: number;
}

type Logger = Pick<typeof console, 'info' | 'warn' | 'error'>;

async function ensureTimescaleExtension(prisma: PrismaClient, logger: Logger): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE`);
    logger.info?.('oracle-maintenance: TimescaleDB extension ensured');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn?.(
      `oracle-maintenance: TimescaleDB extension unavailable (${message}). Skipping hypertable configuration.`
    );
    return false;
  }
}

async function ensureHypertable(
  prisma: PrismaClient,
  logger: Logger,
  table: string,
  timeColumn: string,
  chunkInterval: string
) {
  try {
    await prisma.$executeRawUnsafe(
      `SELECT create_hypertable('${table}', '${timeColumn}', if_not_exists => true);`
    );
    await prisma.$executeRawUnsafe(
      `SELECT set_chunk_time_interval('${table}', INTERVAL '${chunkInterval}');`
    );
    logger.info?.(
      `oracle-maintenance: hypertable ensured for ${table} (${timeColumn}, chunk ${chunkInterval})`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn?.(
      `oracle-maintenance: failed to configure hypertable for ${table} (${timeColumn}): ${message}`
    );
  }
}

async function ensureRetentionPolicy(
  prisma: PrismaClient,
  logger: Logger,
  table: string,
  retentionDays: number
) {
  try {
    await prisma.$executeRawUnsafe(
      `SELECT add_retention_policy('${table}', INTERVAL '${retentionDays} days', if_not_exists => true);`
    );
    logger.info?.(
      `oracle-maintenance: retention policy set for ${table} (${retentionDays} days)`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn?.(
      `oracle-maintenance: failed to configure retention for ${table}: ${message}`
    );
  }
}

export async function ensureOracleStorageMaintenance(
  prisma: PrismaClient,
  options: OracleStorageMaintenanceOptions = {}
) {
  const logger: Logger = options.logger ?? console;
  const signalsRetentionDays = options.signalsRetentionDays ?? 90;
  const evidenceRetentionDays = options.evidenceRetentionDays ?? 90;
  const readStatsRetentionDays = options.readStatsRetentionDays ?? 30;
  const quarantineRetentionDays = options.quarantineRetentionDays ?? 180;
  const chunkIntervalDays = options.chunkIntervalDays ?? 1;
  const readStatsChunkIntervalDays = options.readStatsChunkIntervalDays ?? 1;

  const timescaleAvailable = await ensureTimescaleExtension(prisma, logger);
  if (!timescaleAvailable) {
    return;
  }

  await ensureHypertable(prisma, logger, 'signals', 'ts', `${chunkIntervalDays} day`);
  await ensureHypertable(prisma, logger, 'evidence', 'ts', `${chunkIntervalDays} day`);
  await ensureHypertable(prisma, logger, 'quarantine_events', 'ts', `${chunkIntervalDays} day`);
  await ensureHypertable(
    prisma,
    logger,
    'read_stats',
    'fetchedAt',
    `${readStatsChunkIntervalDays} day`
  );

  await ensureRetentionPolicy(prisma, logger, 'signals', signalsRetentionDays);
  await ensureRetentionPolicy(prisma, logger, 'evidence', evidenceRetentionDays);
  await ensureRetentionPolicy(prisma, logger, 'read_stats', readStatsRetentionDays);
  await ensureRetentionPolicy(prisma, logger, 'quarantine_events', quarantineRetentionDays);
}
