// ======================================================================================
// Risk Warden - Real-time Risk Monitoring & Limit Enforcement
// ======================================================================================
// DoD: VaR 1d ≤3% NAV, DD stop operativo en -10%, registro inmutable
// Monitorea VaR intradía, límites por sleeve, hard stops, pausas automáticas
// ======================================================================================

import { evaluate } from 'mathjs'

export interface RiskLimit {
  id: string
  name: string
  type: 'var' | 'drawdown' | 'position' | 'exposure' | 'concentration'
  value: number
  threshold: number
  unit: 'usd' | 'percentage' | 'ratio'
  severity: 'info' | 'warn' | 'critical'
  enabled: boolean
  sleeve?: string // Optional sleeve-specific limit
  asset?: string // Optional asset-specific limit
}

export interface RiskMeasure {
  id: string
  name: string
  value: number
  limit: number
  utilization: number // 0-1 (percentage of limit used)
  status: 'safe' | 'warning' | 'breach'
  lastUpdate: string
  trend: 'improving' | 'stable' | 'deteriorating'
  metadata?: Record<string, any>
}

export interface PortfolioMetrics {
  totalNAV: number
  var1d: number // 1-day Value at Risk
  var1dPercent: number // VaR as percentage of NAV
  drawdown: number // Current drawdown from peak
  drawdownPercent: number // Drawdown as percentage
  maxDrawdown: number // Historical max drawdown
  leverage: number // Gross leverage ratio
  concentration: Record<string, number> // Asset concentration percentages
  sleeveExposures: Record<string, number> // Sleeve-wise exposures
  lastUpdate: string
}

export interface RiskAction {
  id: string
  type: 'pause' | 'reduce' | 'close' | 'alert' | 'hedge'
  severity: 'low' | 'medium' | 'high' | 'critical'
  trigger: string // What triggered the action
  description: string
  targetSleeve?: string
  targetAsset?: string
  parameters: Record<string, any>
  status: 'pending' | 'executing' | 'completed' | 'failed'
  createdAt: string
  executedAt?: string
  result?: string
}

export interface RiskViolation {
  id: string
  limitId: string
  limitName: string
  currentValue: number
  limitValue: number
  severity: 'warn' | 'critical'
  detectedAt: string
  resolvedAt?: string
  actions: RiskAction[]
  context: Record<string, any>
}

// Mock portfolio data generator
export class MockPortfolioGenerator {
  private static instance: MockPortfolioGenerator
  private baseNAV = 100_000_000 // $100M base NAV
  private historicalPeak = this.baseNAV * 1.15 // Historical peak for drawdown calculation
  
  static getInstance(): MockPortfolioGenerator {
    if (!this.instance) {
      this.instance = new MockPortfolioGenerator()
    }
    return this.instance
  }

  generatePortfolioMetrics(): PortfolioMetrics {
    // Simulate NAV fluctuations
    const navChange = (Math.random() - 0.5) * 0.02 // ±2% daily change potential
    const currentNAV = this.baseNAV * (1 + navChange)
    
    // Calculate VaR (mock using normal distribution approximation)
    const volatility = 0.15 + Math.random() * 0.10 // 15-25% annual volatility
    const confidenceLevel = 0.99 // 99% confidence
    const zScore = 2.33 // 99% confidence z-score
    const dailyVolatility = volatility / Math.sqrt(252) // Daily volatility
    const var1d = currentNAV * dailyVolatility * zScore
    const var1dPercent = (var1d / currentNAV) * 100

    // Calculate drawdown
    const drawdown = Math.max(0, this.historicalPeak - currentNAV)
    const drawdownPercent = (drawdown / this.historicalPeak) * 100
    
    // Update peak if necessary
    if (currentNAV > this.historicalPeak) {
      this.historicalPeak = currentNAV
    }

    // Generate asset concentrations
    const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'USDC', 'USDT']
    const concentration: Record<string, number> = {}
    let remainingWeight = 100
    
    assets.forEach((asset, index) => {
      if (index === assets.length - 1) {
        concentration[asset] = Math.max(0, remainingWeight)
      } else {
        const weight = Math.random() * (remainingWeight / (assets.length - index))
        concentration[asset] = weight
        remainingWeight -= weight
      }
    })

    // Generate sleeve exposures
    const sleeves = ['beta', 'basis', 'realYield', 'arb', 'cash']
    const sleeveExposures: Record<string, number> = {}
    remainingWeight = 100
    
    sleeves.forEach((sleeve, index) => {
      if (index === sleeves.length - 1) {
        sleeveExposures[sleeve] = Math.max(0, remainingWeight)
      } else {
        const weight = Math.random() * (remainingWeight / (sleeves.length - index))
        sleeveExposures[sleeve] = weight
        remainingWeight -= weight
      }
    })

    // Calculate leverage
    const grossExposure = Object.values(sleeveExposures).reduce((sum, exp) => sum + Math.abs(exp), 0)
    const leverage = grossExposure / 100

    return {
      totalNAV: currentNAV,
      var1d,
      var1dPercent,
      drawdown,
      drawdownPercent,
      maxDrawdown: Math.max(drawdownPercent, 8.5), // Mock historical max
      leverage,
      concentration,
      sleeveExposures,
      lastUpdate: new Date().toISOString()
    }
  }
}

// Risk monitoring engine
export class RiskEngine {
  private violations: Map<string, RiskViolation> = new Map()
  private actions: Map<string, RiskAction> = new Map()
  private limits: RiskLimit[] = []
  
  constructor() {
    this.initializeDefaultLimits()
  }

  private initializeDefaultLimits(): void {
    this.limits = [
      {
        id: 'var-1d-global',
        name: 'Global 1-Day VaR Limit',
        type: 'var',
        value: 0,
        threshold: 3.0, // 3% of NAV
        unit: 'percentage',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'drawdown-global',
        name: 'Maximum Drawdown Limit',
        type: 'drawdown', 
        value: 0,
        threshold: 10.0, // 10% maximum drawdown
        unit: 'percentage',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'concentration-single-asset',
        name: 'Single Asset Concentration',
        type: 'concentration',
        value: 0,
        threshold: 25.0, // 25% max in single asset
        unit: 'percentage',
        severity: 'warn',
        enabled: true
      },
      {
        id: 'leverage-global',
        name: 'Global Leverage Limit',
        type: 'exposure',
        value: 0,
        threshold: 2.0, // 2x max leverage
        unit: 'ratio',
        severity: 'warn', 
        enabled: true
      },
      {
        id: 'sleeve-beta-exposure',
        name: 'Beta Sleeve Maximum Exposure',
        type: 'exposure',
        value: 0,
        threshold: 40.0, // 40% max in beta sleeve
        unit: 'percentage',
        severity: 'warn',
        enabled: true,
        sleeve: 'beta'
      }
    ]
  }

  assessRisk(metrics: PortfolioMetrics): RiskMeasure[] {
    const measures: RiskMeasure[] = []
    const now = new Date().toISOString()

    // Assess each limit
    for (const limit of this.limits) {
      if (!limit.enabled) continue

      let currentValue = 0
      let status: RiskMeasure['status'] = 'safe'
      let trend: RiskMeasure['trend'] = 'stable'

      switch (limit.id) {
        case 'var-1d-global':
          currentValue = metrics.var1dPercent
          break
        case 'drawdown-global':
          currentValue = metrics.drawdownPercent
          break
        case 'concentration-single-asset':
          currentValue = Math.max(...Object.values(metrics.concentration))
          break
        case 'leverage-global':
          currentValue = metrics.leverage
          break
        case 'sleeve-beta-exposure':
          currentValue = metrics.sleeveExposures.beta || 0
          break
      }

      const utilization = currentValue / limit.threshold
      
      if (utilization >= 1.0) {
        status = 'breach'
      } else if (utilization >= 0.8) {
        status = 'warning'
      }

      // Mock trend calculation
      trend = utilization > 0.9 ? 'deteriorating' : 
             utilization < 0.5 ? 'improving' : 'stable'

      measures.push({
        id: limit.id,
        name: limit.name,
        value: currentValue,
        limit: limit.threshold,
        utilization,
        status,
        lastUpdate: now,
        trend,
        metadata: {
          type: limit.type,
          unit: limit.unit,
          severity: limit.severity,
          sleeve: limit.sleeve
        }
      })

      // Check for violations
      if (status === 'breach') {
        this.handleRiskViolation(limit, currentValue, metrics)
      } else if (this.violations.has(limit.id) && status !== 'breach') {
        // Violation resolved
        const violation = this.violations.get(limit.id)!
        violation.resolvedAt = now
        this.violations.delete(limit.id)
      }
    }

    return measures
  }

  private handleRiskViolation(
    limit: RiskLimit, 
    currentValue: number, 
    metrics: PortfolioMetrics
  ): void {
    const violationId = `${limit.id}-${Date.now()}`
    
    // Create violation record
    const violation: RiskViolation = {
      id: violationId,
      limitId: limit.id,
      limitName: limit.name,
      currentValue,
      limitValue: limit.threshold,
      severity: limit.severity as 'warn' | 'critical',
      detectedAt: new Date().toISOString(),
      actions: [],
      context: {
        portfolioNAV: metrics.totalNAV,
        var1d: metrics.var1dPercent,
        drawdown: metrics.drawdownPercent,
        leverage: metrics.leverage
      }
    }

    // Determine appropriate actions
    const actions = this.determineRiskActions(limit, currentValue, metrics)
    violation.actions = actions

    this.violations.set(limit.id, violation)
    
    // Execute actions
    for (const action of actions) {
      this.executeRiskAction(action)
    }
  }

  private determineRiskActions(
    limit: RiskLimit,
    currentValue: number,
    metrics: PortfolioMetrics
  ): RiskAction[] {
    const actions: RiskAction[] = []
    const now = new Date().toISOString()

    switch (limit.type) {
      case 'var':
        if (currentValue > limit.threshold * 1.2) { // 20% over limit
          actions.push({
            id: `action-${Date.now()}-1`,
            type: 'reduce',
            severity: 'critical',
            trigger: `VaR breach: ${currentValue.toFixed(2)}% > ${limit.threshold}%`,
            description: 'Reduce risk exposure by 25%',
            parameters: { reductionPercent: 25 },
            status: 'pending',
            createdAt: now
          })
        } else {
          actions.push({
            id: `action-${Date.now()}-2`, 
            type: 'alert',
            severity: 'high',
            trigger: `VaR limit exceeded`,
            description: 'Alert risk management team',
            parameters: { channels: ['slack', 'email'] },
            status: 'pending',
            createdAt: now
          })
        }
        break

      case 'drawdown':
        if (currentValue >= 10.0) { // Critical drawdown level
          actions.push({
            id: `action-${Date.now()}-3`,
            type: 'pause',
            severity: 'critical', 
            trigger: `Maximum drawdown reached: ${currentValue.toFixed(2)}%`,
            description: 'Pause all new positions and evaluate portfolio',
            parameters: { pauseAllSleeves: true },
            status: 'pending',
            createdAt: now
          })
        }
        break

      case 'concentration':
        actions.push({
          id: `action-${Date.now()}-4`,
          type: 'reduce',
          severity: 'medium',
          trigger: `Asset concentration exceeded`,
          description: 'Rebalance overconcentrated positions',
          parameters: { targetConcentration: limit.threshold * 0.8 },
          status: 'pending', 
          createdAt: now
        })
        break
    }

    return actions
  }

  private async executeRiskAction(action: RiskAction): Promise<void> {
    action.status = 'executing'
    action.executedAt = new Date().toISOString()
    
    try {
      // Mock action execution
      switch (action.type) {
        case 'alert':
          // Send alerts via configured channels
          action.result = 'Alert sent successfully'
          break
        case 'pause':
          // Pause trading operations
          action.result = 'Trading paused for all affected sleeves'
          break
        case 'reduce':
          // Reduce position sizes
          action.result = `Positions reduced by ${action.parameters.reductionPercent}%`
          break
        case 'close':
          // Close positions
          action.result = 'Positions closed successfully'
          break
        case 'hedge':
          // Add hedge positions
          action.result = 'Hedge positions added'
          break
      }
      
      action.status = 'completed'
      this.actions.set(action.id, action)
      
    } catch (error) {
      action.status = 'failed'
      action.result = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  getRiskSummary(): {
    totalViolations: number
    activeViolations: number
    criticalViolations: number
    pendingActions: number
    lastAssessment: string
  } {
    const activeViolations = Array.from(this.violations.values()).filter(v => !v.resolvedAt)
    const criticalViolations = activeViolations.filter(v => v.severity === 'critical')
    const pendingActions = Array.from(this.actions.values()).filter(a => a.status === 'pending')

    return {
      totalViolations: this.violations.size,
      activeViolations: activeViolations.length,
      criticalViolations: criticalViolations.length, 
      pendingActions: pendingActions.length,
      lastAssessment: new Date().toISOString()
    }
  }

  getActiveViolations(): RiskViolation[] {
    return Array.from(this.violations.values()).filter(v => !v.resolvedAt)
  }

  getPendingActions(): RiskAction[] {
    return Array.from(this.actions.values()).filter(a => a.status === 'pending')
  }

  updateLimit(limitId: string, updates: Partial<RiskLimit>): boolean {
    const limitIndex = this.limits.findIndex(l => l.id === limitId)
    if (limitIndex === -1) return false

    this.limits[limitIndex] = { ...this.limits[limitIndex], ...updates }
    return true
  }

  getAllLimits(): RiskLimit[] {
    return [...this.limits]
  }
}