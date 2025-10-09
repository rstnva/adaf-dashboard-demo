// ======================================================================================
// Executioner - Smart Order Routing & Execution Engine  
// ======================================================================================
// DoD: Fill-rate ≥95%, tracking error <15bps/dia, cancel/replace on move >0.8%
// TWAP/VWAP/RFQ routing, Tenderly simulation, CoW Swap/Odos/1inch integration
// ======================================================================================

import { v4 as uuidv4 } from 'uuid'

export interface OrderIntent {
  id: string
  strategy: string
  side: 'BUY' | 'SELL'
  asset: string
  baseAsset?: string // For pairs like ETH/BTC
  size: number // In USD
  limits: {
    slippage: number // Maximum slippage (e.g., 0.005 = 0.5%)
    maxCost: number // Maximum execution cost in USD
    timeLimit?: number // Execution time limit in seconds
  }
  hedge?: {
    symbol: string
    ratio: number // Hedge ratio (e.g., 1.0 = 1:1)
  }
  executionStyle: 'MARKET' | 'TWAP' | 'VWAP' | 'RFQ' | 'ICEBERG'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  tags: string[]
  createdAt: string
  createdBy: string
}

export interface ExecutionVenue {
  id: string
  name: string
  type: 'CEX' | 'DEX' | 'RFQ' | 'OTC'
  assets: string[]
  minSize: number
  maxSize: number
  fees: {
    maker: number
    taker: number
  }
  latency: number // Average latency in ms
  reliability: number // 0-1 reliability score
  liquidity: Record<string, number> // Asset liquidity scores
  enabled: boolean
}

export interface ExecutionRoute {
  venues: {
    venue: ExecutionVenue
    allocation: number // 0-1 percentage of order
    expectedPrice: number
    expectedFee: number
    confidence: number
  }[]
  totalExpectedSlippage: number
  totalExpectedFee: number
  estimatedDuration: number // seconds
  riskScore: number // 0-100
  simulationId?: string // Tenderly simulation ID
}

export interface OrderExecution {
  id: string
  intentId: string
  route: ExecutionRoute
  status: 'PENDING' | 'SIMULATING' | 'EXECUTING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'FAILED'
  fills: OrderFill[]
  totalFilled: number
  avgFillPrice: number
  totalFees: number
  actualSlippage: number
  startedAt: string
  completedAt?: string
  error?: string
  metadata: Record<string, any>
}

export interface OrderFill {
  id: string
  executionId: string
  venue: string
  size: number
  price: number
  fee: number
  timestamp: string
  txHash?: string
}

export interface MarketData {
  asset: string
  price: number
  bid: number
  ask: number
  spread: number
  volume24h: number
  lastUpdate: string
  venues: Record<string, {
    price: number
    liquidity: number
    spread: number
  }>
}

// Mock venue configurations
export class VenueManager {
  private venues: ExecutionVenue[] = [
    {
      id: 'cow-swap',
      name: 'CoW Swap',
      type: 'DEX',
      assets: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI'],
      minSize: 100,
      maxSize: 10_000_000,
      fees: { maker: 0, taker: 0.003 }, // MEV protection, slight taker fee
      latency: 45000, // 45 seconds average
      reliability: 0.94,
      liquidity: { ETH: 0.9, WBTC: 0.85, USDC: 0.95, USDT: 0.9, DAI: 0.8 },
      enabled: true
    },
    {
      id: 'odos',
      name: 'Odos',
      type: 'DEX',
      assets: ['ETH', 'WBTC', 'USDC', 'USDT', 'MATIC', 'AVAX'],
      minSize: 50,
      maxSize: 5_000_000,
      fees: { maker: 0, taker: 0.002 },
      latency: 15000, // 15 seconds
      reliability: 0.92,
      liquidity: { ETH: 0.88, WBTC: 0.82, USDC: 0.9, USDT: 0.85 },
      enabled: true
    },
    {
      id: '1inch',
      name: '1inch',
      type: 'DEX', 
      assets: ['ETH', 'WBTC', 'USDC', 'USDT', 'UNI', 'LINK'],
      minSize: 25,
      maxSize: 8_000_000,
      fees: { maker: 0, taker: 0.0025 },
      latency: 12000, // 12 seconds
      reliability: 0.96,
      liquidity: { ETH: 0.92, WBTC: 0.88, USDC: 0.94, USDT: 0.9 },
      enabled: true
    },
    {
      id: 'binance',
      name: 'Binance',
      type: 'CEX',
      assets: ['BTC', 'ETH', 'SOL', 'AVAX', 'USDT', 'USDC'],
      minSize: 10,
      maxSize: 50_000_000,
      fees: { maker: 0.001, taker: 0.001 },
      latency: 200, // 200ms
      reliability: 0.98,
      liquidity: { BTC: 0.98, ETH: 0.96, SOL: 0.9, USDT: 0.99 },
      enabled: false // Disabled for mock/compliance
    },
    {
      id: 'deribit-rfq',
      name: 'Deribit RFQ',
      type: 'RFQ',
      assets: ['BTC', 'ETH'],
      minSize: 100_000,
      maxSize: 25_000_000,
      fees: { maker: 0, taker: 0.0005 },
      latency: 5000, // 5 seconds RFQ response
      reliability: 0.97,
      liquidity: { BTC: 0.95, ETH: 0.93 },
      enabled: true
    }
  ]

  getEnabledVenues(): ExecutionVenue[] {
    return this.venues.filter(v => v.enabled)
  }

  getVenuesForAsset(asset: string): ExecutionVenue[] {
    return this.venues.filter(v => v.enabled && v.assets.includes(asset))
  }

  getVenue(venueId: string): ExecutionVenue | null {
    return this.venues.find(v => v.id === venueId) || null
  }

  updateVenueStatus(venueId: string, enabled: boolean): boolean {
    const venue = this.venues.find(v => v.id === venueId)
    if (!venue) return false
    venue.enabled = enabled
    return true
  }
}

// Mock market data generator
export class MarketDataProvider {
  private basePrice = { BTC: 67000, ETH: 2450, SOL: 95, AVAX: 28, USDC: 1.0, USDT: 1.0 }
  
  generateMarketData(asset: string): MarketData {
    const basePrice = this.basePrice[asset as keyof typeof this.basePrice] || 100
    const volatility = asset.includes('USD') ? 0.001 : 0.02 // Stablecoins less volatile
    
    const priceChange = (Math.random() - 0.5) * volatility
    const currentPrice = basePrice * (1 + priceChange)
    
    const spreadPercent = asset.includes('USD') ? 0.0005 : 0.001 // 0.05% for stables, 0.1% for others
    const spread = currentPrice * spreadPercent
    
    const bid = currentPrice - spread / 2
    const ask = currentPrice + spread / 2

    // Generate venue-specific data
    const venues: Record<string, { price: number; liquidity: number; spread: number }> = {}
    const venueNames = ['cow-swap', 'odos', '1inch', 'deribit-rfq']
    
    venueNames.forEach(venue => {
      const venueVariation = (Math.random() - 0.5) * 0.002 // ±0.2% venue variation
      venues[venue] = {
        price: currentPrice * (1 + venueVariation),
        liquidity: Math.random() * 0.3 + 0.7, // 70-100% liquidity
        spread: spread * (Math.random() * 0.5 + 0.75) // ±25% spread variation
      }
    })

    return {
      asset,
      price: currentPrice,
      bid,
      ask,
      spread,
      volume24h: Math.random() * 1_000_000_000 + 100_000_000, // $100M-$1B
      lastUpdate: new Date().toISOString(),
      venues
    }
  }
}

// Smart routing engine
export class SmartRouter {
  private venueManager = new VenueManager()
  private marketData = new MarketDataProvider()

  async calculateOptimalRoute(intent: OrderIntent): Promise<ExecutionRoute> {
    // Get available venues for the asset
    const availableVenues = this.venueManager.getVenuesForAsset(intent.asset)
    if (availableVenues.length === 0) {
      throw new Error(`No venues available for asset ${intent.asset}`)
    }

    // Get current market data
    const marketData = this.marketData.generateMarketData(intent.asset)
    
    // Calculate route based on execution style
    switch (intent.executionStyle) {
      case 'MARKET':
        return this.calculateMarketRoute(intent, availableVenues, marketData)
      case 'TWAP':
        return this.calculateTWAPRoute(intent, availableVenues, marketData)
      case 'VWAP':
        return this.calculateVWAPRoute(intent, availableVenues, marketData)
      case 'RFQ':
        return this.calculateRFQRoute(intent, availableVenues, marketData)
      default:
        return this.calculateMarketRoute(intent, availableVenues, marketData)
    }
  }

  private calculateMarketRoute(
    intent: OrderIntent, 
    venues: ExecutionVenue[], 
    marketData: MarketData
  ): ExecutionRoute {
    // Sort venues by best expected execution
    const venueScores = venues.map(venue => {
      const venueData = marketData.venues[venue.id]
      if (!venueData) return null

      const expectedPrice = intent.side === 'BUY' ? venueData.price * 1.001 : venueData.price * 0.999
      const expectedFee = intent.size * venue.fees.taker
      const liquidityScore = venue.liquidity[intent.asset] || 0.5
      
      // Combined score based on price, fees, liquidity, and reliability
      const totalCost = expectedFee + (Math.abs(expectedPrice - marketData.price) * intent.size / expectedPrice)
      const score = (liquidityScore * venue.reliability * 100) - totalCost

      return {
        venue,
        expectedPrice,
        expectedFee,
        score,
        confidence: liquidityScore * venue.reliability
      }
    }).filter(Boolean) as NonNullable<(typeof venueScores)[0]>[]

    venueScores.sort((a, b) => b.score - a.score)

    // Allocate order across top venues
    const route: ExecutionRoute['venues'] = []
    let remainingSize = 1.0
    
    for (let i = 0; i < Math.min(3, venueScores.length) && remainingSize > 0; i++) {
      const venueScore = venueScores[i]
      const maxVenueAllocation = Math.min(0.6, remainingSize) // Max 60% to any single venue
      
      let allocation: number
      if (i === 0) {
        allocation = Math.min(maxVenueAllocation, 0.5) // 50% to best venue
      } else if (i === 1) {
        allocation = Math.min(maxVenueAllocation, 0.3) // 30% to second best
      } else {
        allocation = remainingSize // Rest to third venue
      }
      
      route.push({
        venue: venueScore.venue,
        allocation,
        expectedPrice: venueScore.expectedPrice,
        expectedFee: venueScore.expectedFee,
        confidence: venueScore.confidence
      })
      
      remainingSize -= allocation
    }

    // Calculate totals
    const totalExpectedSlippage = route.reduce((sum, r) => sum + (Math.abs(r.expectedPrice - marketData.price) / marketData.price * r.allocation), 0)
    const totalExpectedFee = route.reduce((sum, r) => sum + r.expectedFee * r.allocation, 0)
    const avgLatency = route.reduce((sum, r) => sum + r.venue.latency * r.allocation, 0)
    const avgReliability = route.reduce((sum, r) => sum + r.venue.reliability * r.allocation, 0)
    
    return {
      venues: route,
      totalExpectedSlippage,
      totalExpectedFee,
      estimatedDuration: avgLatency / 1000, // Convert to seconds
      riskScore: Math.max(0, 100 - (avgReliability * 100) + (totalExpectedSlippage * 1000))
    }
  }

  private calculateTWAPRoute(
    intent: OrderIntent,
    venues: ExecutionVenue[], 
    marketData: MarketData
  ): ExecutionRoute {
    // TWAP splits the order over time
    const marketRoute = this.calculateMarketRoute(intent, venues, marketData)
    
    // Adjust for TWAP characteristics
    return {
      ...marketRoute,
      estimatedDuration: Math.max(marketRoute.estimatedDuration, 300), // Min 5 minutes for TWAP
      totalExpectedSlippage: marketRoute.totalExpectedSlippage * 0.7, // Better slippage with time
      riskScore: Math.max(0, marketRoute.riskScore - 15) // Lower risk with time distribution
    }
  }

  private calculateVWAPRoute(
    intent: OrderIntent,
    venues: ExecutionVenue[],
    marketData: MarketData
  ): ExecutionRoute {
    // VWAP considers volume patterns
    const marketRoute = this.calculateMarketRoute(intent, venues, marketData)
    
    return {
      ...marketRoute,
      estimatedDuration: marketRoute.estimatedDuration * 1.5,
      totalExpectedSlippage: marketRoute.totalExpectedSlippage * 0.8, // Volume-weighted pricing
      riskScore: Math.max(0, marketRoute.riskScore - 10)
    }
  }

  private calculateRFQRoute(
    intent: OrderIntent,
    venues: ExecutionVenue[],
    marketData: MarketData
  ): ExecutionRoute {
    // RFQ for larger orders
    const rfqVenues = venues.filter(v => v.type === 'RFQ' && intent.size >= v.minSize)
    
    if (rfqVenues.length === 0) {
      // Fall back to market route
      return this.calculateMarketRoute(intent, venues, marketData)
    }

    // Use best RFQ venue
    const bestRfqVenue = rfqVenues.reduce((best, venue) => 
      venue.reliability > best.reliability ? venue : best
    )

    return {
      venues: [{
        venue: bestRfqVenue,
        allocation: 1.0,
        expectedPrice: marketData.price,
        expectedFee: intent.size * bestRfqVenue.fees.taker,
        confidence: bestRfqVenue.reliability
      }],
      totalExpectedSlippage: 0.002, // 0.2% typical RFQ slippage
      totalExpectedFee: intent.size * bestRfqVenue.fees.taker,
      estimatedDuration: bestRfqVenue.latency / 1000,
      riskScore: (1 - bestRfqVenue.reliability) * 50 // Lower risk for institutional RFQ
    }
  }
}

// Execution engine
export class ExecutionEngine {
  private router = new SmartRouter()
  private executions = new Map<string, OrderExecution>()
  private fills = new Map<string, OrderFill[]>()

  async executeIntent(intent: OrderIntent): Promise<OrderExecution> {
    const executionId = uuidv4()
    
    try {
      // Calculate optimal route
      const route = await this.router.calculateOptimalRoute(intent)
      
      // Create execution record
      const execution: OrderExecution = {
        id: executionId,
        intentId: intent.id,
        route,
        status: 'PENDING',
        fills: [],
        totalFilled: 0,
        avgFillPrice: 0,
        totalFees: 0,
        actualSlippage: 0,
        startedAt: new Date().toISOString(),
        metadata: {
          strategy: intent.strategy,
          urgency: intent.urgency,
          executionStyle: intent.executionStyle
        }
      }

      this.executions.set(executionId, execution)

      // Start execution process
      this.processExecution(execution)

      return execution

    } catch (error) {
      const execution: OrderExecution = {
        id: executionId,
        intentId: intent.id,
        route: { venues: [], totalExpectedSlippage: 0, totalExpectedFee: 0, estimatedDuration: 0, riskScore: 100 },
        status: 'FAILED',
        fills: [],
        totalFilled: 0,
        avgFillPrice: 0,
        totalFees: 0,
        actualSlippage: 0,
        startedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      }

      this.executions.set(executionId, execution)
      return execution
    }
  }

  private async processExecution(execution: OrderExecution): Promise<void> {
    try {
      execution.status = 'EXECUTING'

      // Simulate execution across venues
      for (const routeVenue of execution.route.venues) {
        await this.executeOnVenue(execution, routeVenue)
      }

      // Calculate final metrics
      this.calculateExecutionMetrics(execution)
      
      execution.status = execution.totalFilled >= 0.95 ? 'FILLED' : 'PARTIALLY_FILLED'
      execution.completedAt = new Date().toISOString()

    } catch (error) {
      execution.status = 'FAILED'
      execution.error = error instanceof Error ? error.message : 'Execution failed'
      execution.completedAt = new Date().toISOString()
    }
  }

  private async executeOnVenue(
    execution: OrderExecution, 
    routeVenue: ExecutionRoute['venues'][0]
  ): Promise<void> {
    // Simulate venue execution with realistic timing
    const executionDelay = routeVenue.venue.latency + (Math.random() * 1000)
    await new Promise(resolve => setTimeout(resolve, Math.min(executionDelay, 5000))) // Cap at 5s for testing

    // Simulate fill with some variance
    const fillRate = Math.random() * 0.1 + 0.9 // 90-100% fill rate
    const actualFillSize = routeVenue.allocation * fillRate
    const priceSlippage = (Math.random() - 0.5) * 0.004 // ±0.4% price variance
    const actualPrice = routeVenue.expectedPrice * (1 + priceSlippage)

    // Create fill record
    const fill: OrderFill = {
      id: uuidv4(),
      executionId: execution.id,
      venue: routeVenue.venue.id,
      size: actualFillSize,
      price: actualPrice,
      fee: routeVenue.expectedFee * actualFillSize / routeVenue.allocation,
      timestamp: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    }

    execution.fills.push(fill)
  }

  private calculateExecutionMetrics(execution: OrderExecution): void {
    if (execution.fills.length === 0) return

    // Calculate weighted average price
    let totalValue = 0
    let totalSize = 0
    let totalFees = 0

    for (const fill of execution.fills) {
      totalValue += fill.size * fill.price
      totalSize += fill.size
      totalFees += fill.fee
    }

    execution.totalFilled = totalSize
    execution.avgFillPrice = totalSize > 0 ? totalValue / totalSize : 0
    execution.totalFees = totalFees

    // Calculate actual slippage vs expected price
    if (execution.route.venues.length > 0) {
      const expectedPrice = execution.route.venues.reduce((sum, v) => sum + v.expectedPrice * v.allocation, 0)
      execution.actualSlippage = Math.abs(execution.avgFillPrice - expectedPrice) / expectedPrice
    }
  }

  getExecution(executionId: string): OrderExecution | null {
    return this.executions.get(executionId) || null
  }

  getAllExecutions(): OrderExecution[] {
    return Array.from(this.executions.values())
  }

  getExecutionStats(): {
    totalExecutions: number
    fillRate: number
    avgSlippage: number
    avgExecutionTime: number
    successRate: number
  } {
    const executions = Array.from(this.executions.values())
    const completedExecutions = executions.filter(e => e.status === 'FILLED' || e.status === 'PARTIALLY_FILLED')
    
    const totalFillRate = completedExecutions.reduce((sum, e) => sum + e.totalFilled, 0) / completedExecutions.length
    const avgSlippage = completedExecutions.reduce((sum, e) => sum + e.actualSlippage, 0) / completedExecutions.length
    const successCount = executions.filter(e => e.status === 'FILLED').length

    return {
      totalExecutions: executions.length,
      fillRate: totalFillRate || 0,
      avgSlippage: avgSlippage || 0,
      avgExecutionTime: 30, // Mock average
      successRate: executions.length > 0 ? successCount / executions.length : 0
    }
  }
}