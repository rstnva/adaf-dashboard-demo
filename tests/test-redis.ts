/**
 * ADAF Dashboard Pro - Test Redis Utility
 * 
 * ⚠️  FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA
 * Esta utilidad provee una instancia mock de Redis para tests.
 * En producción, usar Redis cluster real con HA y failover.
 */

import { getSafeRedis } from '@/lib/safe-redis'

/**
 * TODO_REPLACE_WITH_REAL_DATA: Obtiene una instancia mock de Redis para tests
 * En producción: usar pool de conexiones Redis real con configuración de cluster
 * 
 * @returns Instancia mock de Redis compatible con ioredis
 */
export function getTestRedis() {
  // Force MOCK_MODE para asegurar que siempre use mock en tests
  const originalMockMode = process.env.MOCK_MODE
  process.env.MOCK_MODE = '1'
  
  const redis = getSafeRedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: 15, // Base de datos separada para pruebas
    maxRetriesPerRequest: 0, // Disable retries en tests
    enableReadyCheck: false,
    lazyConnect: true
  })
  
  // Restore original MOCK_MODE
  if (originalMockMode !== undefined) {
    process.env.MOCK_MODE = originalMockMode
  } else {
    delete process.env.MOCK_MODE
  }
  
  return redis
}

/**
 * TODO_REPLACE_WITH_REAL_DATA: Datos mock para señales de prueba
 * En producción: usar datos reales de APIs externas
 */
export const mockSignalData = {
  news: {
    critical: {
      type: 'news',
      source: 'MockCryptoNews',
      title: 'URGENT: Major Exchange Security Breach Detected',
      description: 'Critical security vulnerability affecting millions of users worldwide',
      severity: 'critical',
      metadata: {
        keywords: ['hack', 'security', 'breach', 'urgent'],
        sentiment: -0.9,
        impact_score: 0.95
      },
      fingerprint: 'test-critical-news-123',
      timestamp: new Date('2024-01-15T10:00:00Z')
    },
    medium: {
      type: 'news',
      source: 'MockFinancialNews',
      title: 'SEC Announces New Cryptocurrency Regulations',
      description: 'New regulatory framework for digital assets announced by securities commission',
      severity: 'medium',
      metadata: {
        keywords: ['sec', 'regulation', 'cryptocurrency'],
        sentiment: -0.3,
        impact_score: 0.6
      },
      fingerprint: 'test-medium-news-456',
      timestamp: new Date('2024-01-15T11:00:00Z')
    }
  },
  
  tvl: {
    significantDrop: {
      type: 'tvl.drop',
      source: 'MockDeFiLlama',
      title: 'Significant TVL Drop Detected',
      description: 'Total Value Locked dropped by 25% in the last hour',
      severity: 'high',
      metadata: {
        protocol: 'aave',
        current_tvl: 750000000, // $750M
        previous_tvl: 1000000000, // $1B
        drop_percentage: 0.25,
        timeframe: '1h'
      },
      fingerprint: 'test-tvl-drop-789',
      timestamp: new Date('2024-01-15T12:00:00Z')
    }
  },
  
  arbitrage: {
    opportunity: {
      type: 'arbitrage.opportunity',
      source: 'MockArbitrageEngine',
      title: 'Cross-Exchange Arbitrage Opportunity',
      description: 'Price difference detected between exchanges',
      severity: 'medium',
      metadata: {
        asset: 'BTC',
        exchange_1: 'binance',
        exchange_2: 'coinbase',
        price_1: 45000,
        price_2: 45500,
        spread_percentage: 0.011,
        volume_available: 50000
      },
      fingerprint: 'test-arbitrage-101112',
      timestamp: new Date('2024-01-15T13:00:00Z')
    }
  }
}

/**
 * TODO_REPLACE_WITH_REAL_DATA: Limpiar datos mock después de cada test
 * En producción: usar transacciones DB para cleanup automático
 */
export async function cleanupTestData(redis: any, prisma: any) {
  try {
    // Limpiar Redis mock
    if (redis && typeof redis.flushdb === 'function') {
      await redis.flushdb()
    }
    
    // Limpiar base de datos mock en orden correcto para evitar foreign key constraints
    if (prisma) {
      await prisma.alert?.deleteMany?.()
      await prisma.opportunity?.deleteMany?.()
      await prisma.signal?.deleteMany?.()
    }
  } catch (error) {
    // Silenciar errores en cleanup para no afectar tests
    console.warn('Test cleanup warning:', error.message)
  }
}

/**
 * TODO_REPLACE_WITH_REAL_DATA: Simular delay de red para tests realistas
 * En producción: usar latencia real de red y DB
 */
export async function simulateNetworkDelay(ms: number = 10) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export default {
  getTestRedis,
  mockSignalData,
  cleanupTestData,
  simulateNetworkDelay
}