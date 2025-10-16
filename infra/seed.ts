import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Limits for OP-X...')
  
  try {
    // First, ensure the database schema exists
    console.log('📋 Applying database schema...')

    let timescaleAvailable = true
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE`
      console.log('🧩 TimescaleDB extension ensured')
    } catch (extensionError) {
      const message = extensionError instanceof Error ? extensionError.message : String(extensionError)
      if (message.includes('timescaledb') && message.includes('is not available')) {
        timescaleAvailable = false
        console.warn('⚠️ TimescaleDB extension not installed on this Postgres instance. Continuing without hypertables.')
      } else {
        throw extensionError
      }
    }
    
    // Create the metrics table if it doesn't exist (for risk data)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        key TEXT NOT NULL,
        value NUMERIC NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `
    
    // Convert to hypertable for TimescaleDB
    if (timescaleAvailable) {
      await prisma.$executeRaw`
        SELECT create_hypertable('metrics', 'ts', if_not_exists => true)
      `
      console.log('⏱️ Metrics hypertable configured')
    } else {
      console.log('ℹ️ Skipping hypertable conversion (TimescaleDB unavailable)')
    }
    
    console.log('📊 Inserting sample NAV data...')
    const baseNavValue = 1000000; // $1M base
    const today = new Date();
    
    // Insert 90 days of sample NAV data with some drawdown patterns
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create some realistic NAV movement with drawdowns
      let navValue = baseNavValue;
      if (i < 60) navValue *= 1.12; // +12% growth
      if (i < 30) navValue *= 0.95; // -5% drawdown period
      if (i < 10) navValue *= 1.03; // +3% recovery
      
      // Add some daily volatility
      const dailyChange = (Math.random() - 0.5) * 0.02; // ±1% daily vol
      navValue *= (1 + dailyChange);
      
      await prisma.$executeRaw`
        INSERT INTO metrics (ts, key, value, metadata)
        VALUES (${date}::timestamp, 'nav.usd', ${navValue}, '{}'::jsonb)
      `;
    }
  /*
  // Guardrails (limits) - required for execution plan validation
  const limits = [
    { key: 'slippage', value: 0.02, notes: 'porcentaje máximo de slippage (2%)' },
    { key: 'ltv', value: 0.8, notes: 'loan-to-value máximo (80%)' },
    { key: 'hf', value: 1.6, notes: 'health factor mínimo' },
    { key: 'realyield', value: 0.06, notes: 'umbral de real yield (6%)' },
  ]
  
  for (const l of limits) {
    await prisma.limit.upsert({
      where: { key: l.key },
      update: { value: l.value, notes: l.notes },
      create: { key: l.key, value: l.value, notes: l.notes }
    });
  }

  // Execution planning sample data
  console.log('🚀 Seeding sample execution plan data...')
  
  // Create sample execution plan (without opportunity dependency)
  await prisma.$executeRaw`
    INSERT INTO execution_plans (id, "oppId", status, sizing, risk, checklist, handoffs, expiry, artifacts, notes, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      'sample_opp_001',
      'ready',
      ${JSON.stringify({
        notionalPctNAV: 0.15,
        legs: [
          { market: 'ETH/USDC', side: 'BUY', qty: 500, venue: 'Uniswap' },
          { market: 'stETH/ETH', side: 'BUY', qty: 500, venue: 'Lido' }
        ]
      })}::jsonb,
      ${JSON.stringify({
        sl: { type: 'price', value: 1800, unit: 'usd' },
        tp: { type: 'price', value: 2200, unit: 'usd' },
        maxSlippagePct: 0.005
      })}::jsonb,
      ${JSON.stringify([
        { id: 'check_001', title: 'Verify protocol audit reports', done: true, owner: 'Research' },
        { id: 'check_002', title: 'Confirm slashing risk < 0.1%', done: true, owner: 'Risk' },
        { id: 'check_003', title: 'Test withdrawal mechanisms', done: false, owner: 'Trading' },
        { id: 'check_004', title: 'Set up monitoring alerts', done: false, owner: 'Ops' },
        { id: 'check_005', title: 'Legal review of staking terms', done: true, owner: 'Legal' }
      ])}::jsonb,
      ${JSON.stringify([
        { role: 'Trading', owner: 'alice@example.com', note: 'Execute position after final checks' },
        { role: 'Ops', owner: 'bob@example.com', note: 'Monitor and maintain positions' },
        { role: 'Legal', owner: 'carol@example.com', note: 'Review quarterly compliance' }
      ])}::jsonb,
      ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},
      ${JSON.stringify([
        { kind: 'chart', url: 'https://example.com/charts/eth-staking-analysis.png', addedAt: new Date().toISOString() },
        { kind: 'calc', url: 'https://example.com/calcs/risk-assessment.xlsx', addedAt: new Date().toISOString() }
      ])}::jsonb,
      'Initial plan setup for ETH liquid staking strategy. Conservative sizing due to protocol risk.',
      ${new Date()},
      ${new Date()}
    ) ON CONFLICT ("oppId") DO NOTHING
  `;

    
    */
    console.log('✅ Seed completed')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e)
  process.exit(1)
})