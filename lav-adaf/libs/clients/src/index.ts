// ======================================================================================
// LAV/ADAF Client SDK
// ======================================================================================
// Shared client libraries for Gateway API communication and Kafka messaging
// ======================================================================================

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { createLogger, Logger } from 'winston'
import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs'
import Redis from 'ioredis'
import {
  Event,
  EventSchema,
  RegimeSignal,
  OrderIntent,
  Alert,
  KAFKA_TOPICS,
  KafkaTopic
} from '@lav-adaf/proto'

// ======================================================================================
// GATEWAY API CLIENT
// ======================================================================================

export interface GatewayClientConfig {
  baseURL: string
  timeout?: number
  retries?: number
  apiKey?: string
}

export class GatewayClient {
  private client: AxiosInstance
  private logger: Logger

  constructor(config: GatewayClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    })

    this.logger = createLogger({
      level: 'info',
      format: require('winston').format.json(),
      defaultMeta: { service: 'gateway-client' }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('API Request', {
          method: config.method,
          url: config.url,
          headers: config.headers
        })
        return config
      },
      (error) => {
        this.logger.error('Request error', { error: error.message })
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response', {
          status: response.status,
          url: response.config.url
        })
        return response
      },
      (error) => {
        this.logger.error('Response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        })
        return Promise.reject(error)
      }
    )
  }

  // ======================================================================================
  // STATUS & HEALTH
  // ======================================================================================

  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get('/api/status')
    return response.data
  }

  async getHealth(): Promise<boolean> {
    try {
      const response = await this.client.head('/api/status')
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  // ======================================================================================
  // MARKET DATA
  // ======================================================================================

  async getCurrentRegime(): Promise<RegimeSignal> {
    const response = await this.client.get('/api/signals/regime/current')
    return response.data
  }

  async getMarketDials(): Promise<MarketDials> {
    const response = await this.client.get('/api/market/dials')
    return response.data
  }

  async getDerivativesData(params: {
    type: 'funding' | 'gamma'
    asset: string
    days?: number
  }): Promise<DerivativesData> {
    const response = await this.client.get(`/api/derivs/${params.type}`, { params })
    return response.data
  }

  // ======================================================================================
  // PORTFOLIO & RISK
  // ======================================================================================

  async getPositions(): Promise<Position[]> {
    const response = await this.client.get('/api/positions')
    return response.data
  }

  async getPnL(params?: { 
    sleeve?: string
    timeframe?: string
  }): Promise<PnLData> {
    const response = await this.client.get('/api/pnl', { params })
    return response.data
  }

  async getRiskLimits(): Promise<RiskLimit[]> {
    const response = await this.client.get('/api/limits')
    return response.data
  }

  // ======================================================================================
  // ORDER MANAGEMENT
  // ======================================================================================

  async submitOrderIntent(intent: Omit<OrderIntent['payload'], 'id' | 'timestamp'>): Promise<OrderIntentResponse> {
    const response = await this.client.post('/api/orders/intent', intent)
    return response.data
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await this.client.get(`/api/orders/status/${orderId}`)
    return response.data
  }

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    const response = await this.client.post(`/api/orders/cancel/${orderId}`)
    return response.data
  }

  // ======================================================================================
  // GOVERNANCE
  // ======================================================================================

  async getGovernanceProposals(params?: {
    dao?: string
    status?: string
  }): Promise<GovernanceProposal[]> {
    const response = await this.client.get('/api/governance/proposals', { params })
    return response.data
  }

  async submitVote(vote: GovernanceVotePayload): Promise<VoteResponse> {
    const response = await this.client.post('/api/governance/vote', vote)
    return response.data
  }

  async getGovernancePositions(): Promise<GovernancePosition[]> {
    const response = await this.client.get('/api/governance/positions')
    return response.data
  }
}

// ======================================================================================
// KAFKA EVENT CLIENT
// ======================================================================================

export interface EventClientConfig extends KafkaConfig {
  groupId: string
}

export class EventClient {
  private kafka: Kafka
  private producer?: Producer
  private consumer?: Consumer
  private logger: Logger

  constructor(config: EventClientConfig) {
    this.kafka = new Kafka(config)
    this.logger = createLogger({
      level: 'info',
      format: require('winston').format.json(),
      defaultMeta: { service: 'event-client' }
    })
  }

  async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer()
      this.consumer = this.kafka.consumer({ groupId: 'lav-adaf-client' })
      
      await this.producer.connect()
      await this.consumer.connect()
      
      this.logger.info('Kafka client connected')
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', { error })
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer?.disconnect()
      await this.consumer?.disconnect()
      this.logger.info('Kafka client disconnected')
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka', { error })
    }
  }

  async publishEvent<T extends Event>(topic: KafkaTopic, event: T): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not connected')
    }

    try {
      // Validate event against schema
      const validatedEvent = EventSchema.parse(event)
      
      await this.producer.send({
        topic,
        messages: [{
          key: validatedEvent.id,
          value: JSON.stringify(validatedEvent),
          timestamp: Date.now().toString(),
          headers: {
            source: validatedEvent.source,
            type: validatedEvent.type,
            version: validatedEvent.version
          }
        }]
      })

      this.logger.info('Event published', {
        topic,
        eventId: validatedEvent.id,
        eventType: validatedEvent.type
      })
    } catch (error) {
      this.logger.error('Failed to publish event', { topic, error })
      throw error
    }
  }

  async subscribeToEvents<T extends Event>(
    topics: KafkaTopic[],
    handler: (event: T) => Promise<void>
  ): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not connected')
    }

    try {
      await this.consumer.subscribe({ topics })

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return

            const eventData = JSON.parse(message.value.toString())
            const validatedEvent = EventSchema.parse(eventData) as T

            this.logger.debug('Event received', {
              topic,
              partition,
              eventId: validatedEvent.id,
              eventType: validatedEvent.type
            })

            await handler(validatedEvent)
          } catch (error) {
            this.logger.error('Failed to process event', {
              topic,
              partition,
              error
            })
          }
        }
      })
    } catch (error) {
      this.logger.error('Failed to subscribe to events', { topics, error })
      throw error
    }
  }
}

// ======================================================================================
// REDIS CACHE CLIENT
// ======================================================================================

export interface CacheClientConfig {
  host: string
  port: number
  password?: string
  db?: number
}

export class CacheClient {
  private redis: Redis
  private logger: Logger

  constructor(config: CacheClientConfig) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })

    this.logger = createLogger({
      level: 'info',
      format: require('winston').format.json(),
      defaultMeta: { service: 'cache-client' }
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Redis client connected')
    })

    this.redis.on('error', (error) => {
      this.logger.error('Redis client error', { error: error.message })
    })
  }

  async connect(): Promise<void> {
    await this.redis.connect()
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect()
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value)
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serializedValue)
    } else {
      await this.redis.set(key, serializedValue)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key)
    return result === 1
  }

  async setAdd(key: string, ...members: string[]): Promise<void> {
    await this.redis.sadd(key, ...members)
  }

  async setMembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key)
  }

  async hashSet(key: string, field: string, value: any): Promise<void> {
    await this.redis.hset(key, field, JSON.stringify(value))
  }

  async hashGet<T>(key: string, field: string): Promise<T | null> {
    const value = await this.redis.hget(key, field)
    return value ? JSON.parse(value) : null
  }

  async hashGetAll(key: string): Promise<Record<string, any>> {
    const hash = await this.redis.hgetall(key)
    const result: Record<string, any> = {}
    
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value)
      } catch {
        result[field] = value
      }
    }
    
    return result
  }
}

// ======================================================================================
// TYPE DEFINITIONS
// ======================================================================================

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  services: ServiceHealth[]
  features: Record<string, boolean>
  metrics: SystemMetrics
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  lastCheck: string
  details?: Record<string, any>
}

export interface SystemMetrics {
  uptime: number
  memory: {
    used: number
    free: number
    total: number
  }
  cpu: {
    usage: number
  }
}

export interface MarketDials {
  timestamp: string
  regime: string
  score: number
  dials: Record<string, {
    value: number
    signal: string
    confidence: number
  }>
}

export interface DerivativesData {
  asset: string
  type: 'funding' | 'gamma'
  data: any[]
  metadata: Record<string, any>
}

export interface Position {
  asset: string
  size: number
  notional: number
  unrealizedPnl: number
  sleeve: string
}

export interface PnLData {
  totalPnl: number
  unrealizedPnl: number
  realizedPnl: number
  bySleeve: Record<string, number>
  byAsset: Record<string, number>
}

export interface RiskLimit {
  id: string
  name: string
  current: number
  limit: number
  utilization: number
  status: 'safe' | 'warning' | 'breach'
}

export interface OrderIntentResponse {
  orderId: string
  status: string
  estimatedExecution: {
    duration: number
    slippage: number
    fees: number
  }
}

export interface OrderStatus {
  orderId: string
  status: string
  fills: any[]
  totalFilled: number
  avgPrice: number
}

export interface CancelOrderResponse {
  orderId: string
  cancelled: boolean
  reason?: string
}

export interface GovernanceProposal {
  dao: string
  proposalId: string
  title: string
  description: string
  deadline: string
  status: string
  recommendation?: string
}

export interface GovernanceVotePayload {
  dao: string
  proposalId: string
  stance: 'FOR' | 'AGAINST' | 'ABSTAIN'
  rationale: string
}

export interface VoteResponse {
  success: boolean
  txHash?: string
  error?: string
}

export interface GovernancePosition {
  dao: string
  token: string
  balance: number
  votingPower: number
  delegated: boolean
}

// ======================================================================================
// FACTORY FUNCTIONS
// ======================================================================================

export function createGatewayClient(config: GatewayClientConfig): GatewayClient {
  return new GatewayClient(config)
}

export function createEventClient(config: EventClientConfig): EventClient {
  return new EventClient(config)
}

export function createCacheClient(config: CacheClientConfig): CacheClient {
  return new CacheClient(config)
}