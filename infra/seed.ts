import { PrismaClient } from '@prisma/client';

import { seedOracleFeeds } from '../services/oracle-core/registry/seed-feeds';
import { ensureOracleStorageMaintenance } from '../services/oracle-core/storage/maintenance';
import { getSafeRedis } from '../src/lib/safe-redis';

const prisma = new PrismaClient();

async function ensureMetricsTable() {
  console.log('📊 Ensuring NAV metrics table...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      key TEXT NOT NULL,
      value NUMERIC NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb
    )
  `;

  try {
    await prisma.$executeRaw`
      SELECT create_hypertable('metrics', 'ts', if_not_exists => true)
    `;
    console.log('⏱️ Metrics hypertable configured');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `ℹ️ Timescale hypertable setup for metrics skipped (${message}). Continuing without chunking.`
    );
  }
}

async function seedNavSeries() {
  console.log('� Rebuilding NAV time-series sample (90d window)...');

  await prisma.$executeRaw`DELETE FROM metrics WHERE key = 'nav.usd'`;

  const baseNavValue = 1_000_000; // $1M base
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    let navValue = baseNavValue;
    if (i < 60) navValue *= 1.12; // +12% growth
    if (i < 30) navValue *= 0.95; // -5% drawdown period
    if (i < 10) navValue *= 1.03; // +3% recovery

    const dailyChange = (Math.random() - 0.5) * 0.02; // ±1% daily vol
    navValue *= 1 + dailyChange;

    await prisma.$executeRaw`
      INSERT INTO metrics (ts, key, value, metadata)
      VALUES (${date}::timestamp, 'nav.usd', ${navValue}, '{}'::jsonb)
    `;
  }
}

async function seedOracleRegistry() {
  console.log('� Seeding Oracle registry (feeds + cache)...');
  const redis = getSafeRedis();
  await seedOracleFeeds({ prisma, redis, logger: console });
}

async function main() {
  console.log('🌱 ADAF infrastructure seed starting...');

  try {
    await ensureOracleStorageMaintenance(prisma, { logger: console });
    await ensureMetricsTable();
    await seedNavSeries();
    await seedOracleRegistry();
    console.log('✅ Seed completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});