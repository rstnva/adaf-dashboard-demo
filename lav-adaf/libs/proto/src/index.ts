// ======================================================================================
// LAV/ADAF Protocol Definitions
// ======================================================================================
// Shared event schemas and type definitions for inter-agent communication
// Kafka topics: signals.*, orders.*, risk.*, alerts.*, governance.*
// ======================================================================================

import { z } from 'zod'

// ======================================================================================
// BASE SCHEMAS
// ======================================================================================

export const BaseEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: z.string(),
  version: z.string().default('1.3.0'),
  correlationId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export type BaseEvent = z.infer<typeof BaseEventSchema>

// ======================================================================================
// MARKET SIGNALS (signals.*)
// ======================================================================================

export const MarketDialSchema = z.object({
  name: z.enum(['funding', 'openInterest', 'fees', 'utilizationLending', 'ethStaked', 'stablecoinMcap', 'etfFlows']),
  value: z.number(),
  normalized: z.number().min(0).max(100),
  signal: z.enum(['bullish', 'bearish', 'neutral']),
  confidence: z.number().min(0).max(1),
  lastUpdate: z.string().datetime(),
  metadata: z.record(z.any()).optional()
})

export const RegimeSignalSchema = BaseEventSchema.extend({
  type: z.literal('regime_change'),
  payload: z.object({
    regime: z.enum(['expansion', 'compression', 'neutral']),
    score: z.number().min(0).max(100),
    dials: z.record(MarketDialSchema),
    duration: z.number().positive(), // minutes in current regime
    previous: z.object({
      regime: z.enum(['expansion', 'compression', 'neutral']),
      changedAt: z.string().datetime()
    }).optional()
  })
})

export const TechnicalSignalSchema = BaseEventSchema.extend({
  type: z.literal('technical_signal'),
  payload: z.object({
    asset: z.string(),
    signal: z.enum(['BUY', 'SELL', 'HOLD']),
    strength: z.number().min(0).max(1),
    indicators: z.record(z.number()),
    timeframe: z.string(),
    confidence: z.number().min(0).max(1)
  })
})

export const FundamentalSignalSchema = BaseEventSchema.extend({
  type: z.literal('fundamental_signal'),
  payload: z.object({
    asset: z.string(),
    metric: z.string(),
    value: z.number(),
    change: z.number(),
    significance: z.enum(['low', 'medium', 'high', 'critical']),
    interpretation: z.string()
  })
})

// ======================================================================================
// ORDER MANAGEMENT (orders.*)
// ======================================================================================

export const OrderIntentSchema = BaseEventSchema.extend({
  type: z.literal('order_intent'),
  payload: z.object({
    strategy: z.string(),
    side: z.enum(['BUY', 'SELL']),
    asset: z.string(),
    size: z.number().positive(),
    limits: z.object({
      slippage: z.number().min(0),
      maxCost: z.number().positive(),
      timeLimit: z.number().positive().optional()
    }),
    hedge: z.object({
      symbol: z.string(),
      ratio: z.number()
    }).optional(),
    executionStyle: z.enum(['MARKET', 'TWAP', 'VWAP', 'RFQ', 'ICEBERG']),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    tags: z.array(z.string())
  })
})

export const OrderExecutionSchema = BaseEventSchema.extend({
  type: z.literal('order_execution'),
  payload: z.object({
    intentId: z.string().uuid(),
    status: z.enum(['PENDING', 'SIMULATING', 'EXECUTING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'FAILED']),
    fills: z.array(z.object({
      id: z.string().uuid(),
      venue: z.string(),
      size: z.number(),
      price: z.number(),
      fee: z.number(),
      timestamp: z.string().datetime(),
      txHash: z.string().optional()
    })),
    totalFilled: z.number().min(0),
    avgFillPrice: z.number().min(0),
    totalFees: z.number().min(0),
    actualSlippage: z.number().min(0)
  })
})

// ======================================================================================
// RISK MANAGEMENT (risk.*)
// ======================================================================================

export const RiskViolationSchema = BaseEventSchema.extend({
  type: z.literal('risk_violation'),
  payload: z.object({
    limitId: z.string(),
    limitName: z.string(),
    currentValue: z.number(),
    limitValue: z.number(),
    severity: z.enum(['warn', 'critical']),
    action: z.enum(['pause', 'reduce', 'close', 'alert', 'hedge']),
    context: z.object({
      portfolioNAV: z.number(),
      var1d: z.number(),
      drawdown: z.number(),
      leverage: z.number()
    })
  })
})

export const PortfolioMetricsSchema = BaseEventSchema.extend({
  type: z.literal('portfolio_metrics'),
  payload: z.object({
    totalNAV: z.number(),
    var1d: z.number(),
    var1dPercent: z.number(),
    drawdown: z.number(),
    drawdownPercent: z.number(),
    leverage: z.number(),
    concentration: z.record(z.number()),
    sleeveExposures: z.record(z.number())
  })
})

// ======================================================================================
// ALERTS & NOTIFICATIONS (alerts.*)
// ======================================================================================

export const AlertSchema = BaseEventSchema.extend({
  type: z.literal('alert'),
  payload: z.object({
    title: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warn', 'error', 'critical']),
    category: z.enum(['risk', 'execution', 'market', 'system', 'compliance']),
    targetAudience: z.array(z.enum(['traders', 'risk_managers', 'executives', 'compliance'])),
    channels: z.array(z.enum(['slack', 'email', 'sms', 'dashboard'])),
    actionable: z.boolean(),
    actions: z.array(z.object({
      label: z.string(),
      endpoint: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE'])
    })).optional()
  })
})

export const SystemHealthSchema = BaseEventSchema.extend({
  type: z.literal('system_health'),
  payload: z.object({
    service: z.string(),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    uptime: z.number(),
    latency: z.number(),
    errorRate: z.number(),
    throughput: z.number(),
    dependencies: z.record(z.enum(['healthy', 'degraded', 'unhealthy']))
  })
})

// ======================================================================================
// GOVERNANCE (governance.*)
// ======================================================================================

export const GovernanceProposalSchema = BaseEventSchema.extend({
  type: z.literal('governance_proposal'),
  payload: z.object({
    dao: z.string(),
    proposalId: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.enum(['treasury', 'protocol', 'grants', 'governance']),
    votingPower: z.number(),
    deadline: z.string().datetime(),
    currentTally: z.object({
      for: z.number(),
      against: z.number(),
      abstain: z.number()
    }),
    recommendation: z.enum(['FOR', 'AGAINST', 'ABSTAIN']).optional(),
    rationale: z.string().optional()
  })
})

export const GovernanceVoteSchema = BaseEventSchema.extend({
  type: z.literal('governance_vote'),
  payload: z.object({
    dao: z.string(),
    proposalId: z.string(),
    stance: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
    votingPower: z.number(),
    rationale: z.string(),
    txTemplate: z.object({
      to: z.string(),
      data: z.string(),
      value: z.string().default('0')
    }).optional()
  })
})

// ======================================================================================
// SETTLEMENT & CLEARING (settlement.*)
// ======================================================================================

export const SettlementBatchSchema = BaseEventSchema.extend({
  type: z.literal('settlement_batch'),
  payload: z.object({
    batchId: z.string().uuid(),
    venue: z.string(),
    legs: z.array(z.object({
      asset: z.string(),
      side: z.enum(['BUY', 'SELL']),
      quantity: z.number(),
      price: z.number(),
      counterparty: z.string().optional()
    })),
    netAmount: z.number(),
    currency: z.string(),
    settlementDate: z.string().datetime(),
    status: z.enum(['pending', 'confirmed', 'settled', 'failed']),
    references: z.record(z.string())
  })
})

// ======================================================================================
// DEFI OPERATIONS (defi.*)
// ======================================================================================

export const DefiPositionSchema = BaseEventSchema.extend({
  type: z.literal('defi_position'),
  payload: z.object({
    protocol: z.string(),
    position: z.object({
      collateral: z.number(),
      debt: z.number(),
      ltv: z.number(),
      healthFactor: z.number(),
      liquidationThreshold: z.number()
    }),
    action: z.enum(['supply', 'withdraw', 'borrow', 'repay', 'rebalance']),
    targetLtv: z.number().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical'])
  })
})

export const YieldOpportunitySchema = BaseEventSchema.extend({
  type: z.literal('yield_opportunity'),
  payload: z.object({
    protocol: z.string(),
    asset: z.string(),
    apr: z.number(),
    apy: z.number(),
    tvl: z.number(),
    risk: z.enum(['low', 'medium', 'high']),
    duration: z.string().optional(), // For fixed-term opportunities
    minAmount: z.number(),
    maxAmount: z.number().optional()
  })
})

// ======================================================================================
// TYPE EXPORTS
// ======================================================================================

export type RegimeSignal = z.infer<typeof RegimeSignalSchema>
export type TechnicalSignal = z.infer<typeof TechnicalSignalSchema>
export type FundamentalSignal = z.infer<typeof FundamentalSignalSchema>
export type OrderIntent = z.infer<typeof OrderIntentSchema>
export type OrderExecution = z.infer<typeof OrderExecutionSchema>
export type RiskViolation = z.infer<typeof RiskViolationSchema>
export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>
export type Alert = z.infer<typeof AlertSchema>
export type SystemHealth = z.infer<typeof SystemHealthSchema>
export type GovernanceProposal = z.infer<typeof GovernanceProposalSchema>
export type GovernanceVote = z.infer<typeof GovernanceVoteSchema>
export type SettlementBatch = z.infer<typeof SettlementBatchSchema>
export type DefiPosition = z.infer<typeof DefiPositionSchema>
export type YieldOpportunity = z.infer<typeof YieldOpportunitySchema>

// Union type for all events
export const EventSchema = z.discriminatedUnion('type', [
  RegimeSignalSchema,
  TechnicalSignalSchema,
  FundamentalSignalSchema,
  OrderIntentSchema,
  OrderExecutionSchema,
  RiskViolationSchema,
  PortfolioMetricsSchema,
  AlertSchema,
  SystemHealthSchema,
  GovernanceProposalSchema,
  GovernanceVoteSchema,
  SettlementBatchSchema,
  DefiPositionSchema,
  YieldOpportunitySchema
])

export type Event = z.infer<typeof EventSchema>

// ======================================================================================
// KAFKA TOPIC CONFIGURATION
// ======================================================================================

export const KAFKA_TOPICS = {
  SIGNALS_REGIME: 'signals.regime',
  SIGNALS_TECHNICAL: 'signals.technical', 
  SIGNALS_FUNDAMENTAL: 'signals.fundamental',
  ORDERS_INTENT: 'orders.intent',
  ORDERS_EXECUTION: 'orders.execution',
  RISK_VIOLATION: 'risk.violation',
  RISK_METRICS: 'risk.metrics',
  ALERTS_SYSTEM: 'alerts.system',
  ALERTS_RISK: 'alerts.risk',
  ALERTS_EXECUTION: 'alerts.execution',
  GOVERNANCE_PROPOSAL: 'governance.proposal',
  GOVERNANCE_VOTE: 'governance.vote',
  SETTLEMENT_BATCH: 'settlement.batch',
  DEFI_POSITION: 'defi.position',
  DEFI_OPPORTUNITY: 'defi.opportunity'
} as const

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS]

// ======================================================================================
// EVENT UTILITIES
// ======================================================================================

export function createBaseEvent(source: string, correlationId?: string): Omit<BaseEvent, 'id' | 'timestamp'> {
  return {
    source,
    version: '1.3.0',
    correlationId,
    metadata: {}
  }
}

export function validateEvent(event: unknown): Event {
  return EventSchema.parse(event)
}

export function isEventType<T extends Event['type']>(event: Event, type: T): event is Extract<Event, { type: T }> {
  return event.type === type
}