import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for ADAF Dashboard...')
  
  try {
    // First, ensure the database schema exists
    console.log('📋 Applying database schema...')
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE`
    
    // Create the metrics table if it doesn't exist (for risk data)
    // For TimescaleDB, we need to include the partitioning column in the primary key
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS metrics (
        ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        key TEXT NOT NULL,
        value NUMERIC NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        PRIMARY KEY (ts, key)
      )
    `
    
    // Convert to hypertable for TimescaleDB
    await prisma.$executeRaw`
      SELECT create_hypertable('metrics', 'ts', if_not_exists => true)
    `
    
    console.log('📊 Inserting sample NAV data for risk calculations...')
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

    console.log('✅ Database seeding completed successfully')
    
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