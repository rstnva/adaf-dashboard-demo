// ======================================================================================
// LAV/ADAF Gateway - Configuration Management
// ======================================================================================

import { z } from 'zod'

const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TIMEZONE: z.string().default('America/Mexico_City'),
  
  // Databases
  POSTGRES_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CLICKHOUSE_URL: z.string().default('http://localhost:8123'),
  
  // Messaging
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('lav-adaf-gateway'),
  KAFKA_GROUP_ID: z.string().default('lav-adaf-gateway-group'),
  
  // Risk Management
  MAX_POSITION_SIZE: z.coerce.number().default(1000000), // $1M USD
  MAX_VAR_1D: z.coerce.number().default(0.03), // 3%
  MAX_DRAWDOWN: z.coerce.number().default(0.10), // 10%
  DEFAULT_SLIPPAGE_LIMIT: z.coerce.number().default(0.005), // 0.5%
  
  // External APIs (Mock mode defaults)
  MOCK_DATA_ENABLED: z.coerce.boolean().default(true),
  COINBASE_API_KEY: z.string().optional(),
  BINANCE_API_KEY: z.string().optional(),
  
  // Security
  FIREBLOCKS_API_KEY: z.string().optional(),
  SAFE_ADDRESS: z.string().optional(),
  TRM_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_LIVE_TRADING: z.coerce.boolean().default(false),
  ENABLE_ML_AGENTS: z.coerce.boolean().default(true),
  ENABLE_GOVERNANCE: z.coerce.boolean().default(true),
})

export type Config = z.infer<typeof configSchema>

// Parse and validate environment variables
function loadConfig(): Config {
  try {
    const rawConfig = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      LOG_LEVEL: process.env.LOG_LEVEL,
      TIMEZONE: process.env.TIMEZONE,
      
      POSTGRES_URL: process.env.POSTGRES_URL,
      REDIS_URL: process.env.REDIS_URL,
      CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
      
      KAFKA_BROKERS: process.env.KAFKA_BROKERS,
      KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
      KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
      
      MAX_POSITION_SIZE: process.env.MAX_POSITION_SIZE,
      MAX_VAR_1D: process.env.MAX_VAR_1D,
      MAX_DRAWDOWN: process.env.MAX_DRAWDOWN,
      DEFAULT_SLIPPAGE_LIMIT: process.env.DEFAULT_SLIPPAGE_LIMIT,
      
      MOCK_DATA_ENABLED: process.env.MOCK_DATA_ENABLED,
      COINBASE_API_KEY: process.env.COINBASE_API_KEY,
      BINANCE_API_KEY: process.env.BINANCE_API_KEY,
      
      FIREBLOCKS_API_KEY: process.env.FIREBLOCKS_API_KEY,
      SAFE_ADDRESS: process.env.SAFE_ADDRESS,
      TRM_API_KEY: process.env.TRM_API_KEY,
      
      ENABLE_LIVE_TRADING: process.env.ENABLE_LIVE_TRADING,
      ENABLE_ML_AGENTS: process.env.ENABLE_ML_AGENTS,
      ENABLE_GOVERNANCE: process.env.ENABLE_GOVERNANCE,
    }

    return configSchema.parse(rawConfig)
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    process.exit(1)
  }
}

export const config = loadConfig()

// Configuration helpers
export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTesting = config.NODE_ENV === 'test'

// Derived configurations
export const dbConfig = {
  url: config.POSTGRES_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
}

export const redisConfig = {
  url: config.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
}

export const kafkaConfig = {
  brokers: config.KAFKA_BROKERS.split(','),
  clientId: config.KAFKA_CLIENT_ID,
  groupId: config.KAFKA_GROUP_ID,
  ssl: isProduction,
}

// Risk limits
export const riskLimits = {
  maxPositionSize: config.MAX_POSITION_SIZE,
  maxVar1d: config.MAX_VAR_1D,
  maxDrawdown: config.MAX_DRAWDOWN,
  defaultSlippageLimit: config.DEFAULT_SLIPPAGE_LIMIT,
}

// Feature flags
export const features = {
  liveTrading: config.ENABLE_LIVE_TRADING,
  mlAgents: config.ENABLE_ML_AGENTS,
  governance: config.ENABLE_GOVERNANCE,
  mockData: config.MOCK_DATA_ENABLED,
}

export default config