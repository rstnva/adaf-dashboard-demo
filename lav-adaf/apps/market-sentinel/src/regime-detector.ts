// ======================================================================================
// Market Sentinel - 5 Diales + Régimen Detection System
// ======================================================================================
// DoD: Latencia <60s, precisión ≥70% vs etiqueta de régimen, alertas en cambios
// Calcula funding rates, OI, fees/MEV, utilización lending, %ETH staked, mcap stables, ETF flows
// ======================================================================================

export interface MarketDial {
  name: string
  value: number
  normalized: number // 0-100 score
  signal: 'bullish' | 'bearish' | 'neutral'
  confidence: number // 0-1
  lastUpdate: string
  metadata?: Record<string, any>
}

export interface MarketRegime {
  regime: 'expansion' | 'compression' | 'neutral'
  score: number // 0-100 overall confidence
  dials: {
    funding: MarketDial
    openInterest: MarketDial
    fees: MarketDial
    utilizationLending: MarketDial
    ethStaked: MarketDial
    stablecoinMcap: MarketDial
    etfFlows: MarketDial
  }
  timestamp: string
  duration: number // minutes in current regime
  previous?: {
    regime: MarketRegime['regime']
    changedAt: string
  }
}

export interface RegimeChangeAlert {
  from: MarketRegime['regime']
  to: MarketRegime['regime']
  confidence: number
  triggeredBy: string[] // which dials triggered the change
  timestamp: string
  significance: 'minor' | 'major' | 'critical'
}

// Mock data generators for development
export class MockDataGenerator {
  private static instance: MockDataGenerator
  private baseTimestamp = Date.now()
  
  static getInstance(): MockDataGenerator {
    if (!this.instance) {
      this.instance = new MockDataGenerator()
    }
    return this.instance
  }

  // Generate realistic funding rates across venues
  generateFundingData(): MarketDial {
    const baseRate = 0.01 // 1% annualized
    const volatility = 0.5
    const noise = (Math.random() - 0.5) * volatility
    const fundingRate = baseRate * (1 + noise)
    
    // Normalize to 0-100 scale (negative funding = bullish = higher score)
    const normalized = Math.max(0, Math.min(100, 50 - (fundingRate * 1000)))
    
    return {
      name: 'funding',
      value: fundingRate,
      normalized,
      signal: fundingRate < 0 ? 'bullish' : fundingRate > 0.02 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      lastUpdate: new Date().toISOString(),
      metadata: {
        venues: ['binance', 'bybit', 'okx', 'deribit'],
        avgRate8h: fundingRate,
        trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
      }
    }
  }

  // Generate open interest data
  generateOpenInterestData(): MarketDial {
    const baseOI = 15_000_000_000 // $15B baseline
    const change24h = (Math.random() - 0.5) * 0.2 // ±20% daily change
    const currentOI = baseOI * (1 + change24h)
    
    // High OI during expansion, low during compression
    const normalized = Math.max(0, Math.min(100, 30 + (change24h * 200)))
    
    return {
      name: 'openInterest',
      value: currentOI,
      normalized,
      signal: change24h > 0.05 ? 'bullish' : change24h < -0.05 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.2 + 0.8,
      lastUpdate: new Date().toISOString(),
      metadata: {
        change24h: change24h * 100,
        btcOI: currentOI * 0.6,
        ethOI: currentOI * 0.3,
        altOI: currentOI * 0.1
      }
    }
  }

  // Generate fees and MEV data
  generateFeesData(): MarketDial {
    const baseFees = 45_000_000 // $45M daily fees baseline
    const mevBoost = Math.random() * 0.5 + 0.1 // 10-60% MEV boost
    const totalFees = baseFees * (1 + mevBoost)
    
    // Higher fees = more activity = expansion signal
    const normalized = Math.max(0, Math.min(100, 40 + (mevBoost * 100)))
    
    return {
      name: 'fees',
      value: totalFees,
      normalized,
      signal: mevBoost > 0.3 ? 'bullish' : mevBoost < 0.15 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.25 + 0.75,
      lastUpdate: new Date().toISOString(),
      metadata: {
        ethFees: totalFees * 0.4,
        l2Fees: totalFees * 0.35,
        mevValue: totalFees * mevBoost,
        gasPrice: Math.floor(Math.random() * 50) + 20
      }
    }
  }

  // Generate DeFi lending utilization
  generateLendingUtilizationData(): MarketDial {
    const baseUtilization = 0.65 // 65% baseline
    const change = (Math.random() - 0.5) * 0.3 // ±30% change
    const utilization = Math.max(0.1, Math.min(0.95, baseUtilization + change))
    
    // High utilization = risk-on = bullish signal
    const normalized = utilization * 100
    
    return {
      name: 'utilizationLending',
      value: utilization,
      normalized,
      signal: utilization > 0.8 ? 'bullish' : utilization < 0.4 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.2 + 0.8,
      lastUpdate: new Date().toISOString(),
      metadata: {
        aaveUtilization: utilization * 0.9,
        compoundUtilization: utilization * 1.1,
        topAssets: ['USDC', 'USDT', 'ETH', 'WBTC']
      }
    }
  }

  // Generate ETH staking percentage
  generateEthStakedData(): MarketDial {
    const baseStaked = 0.28 // 28% of ETH staked
    const change = (Math.random() - 0.5) * 0.02 // ±2% change
    const stakedPercentage = Math.max(0.15, Math.min(0.45, baseStaked + change))
    
    // Higher staking = more bullish long-term
    const normalized = (stakedPercentage - 0.15) / 0.3 * 100
    
    return {
      name: 'ethStaked',
      value: stakedPercentage,
      normalized,
      signal: stakedPercentage > 0.32 ? 'bullish' : stakedPercentage < 0.25 ? 'bearish' : 'neutral',
      confidence: 0.95, // Very reliable data
      lastUpdate: new Date().toISOString(),
      metadata: {
        totalStaked: stakedPercentage * 120_000_000, // ~120M ETH supply
        validators: Math.floor(stakedPercentage * 120_000_000 / 32),
        withdrawalQueue: Math.floor(Math.random() * 50000)
      }
    }
  }

  // Generate stablecoin market cap data
  generateStablecoinMcapData(): MarketDial {
    const baseMcap = 130_000_000_000 // $130B baseline
    const change = (Math.random() - 0.5) * 0.15 // ±15% change
    const mcap = baseMcap * (1 + change)
    
    // Growing stablecoin supply = preparation for risk-on
    const normalized = Math.max(0, Math.min(100, 50 + (change * 200)))
    
    return {
      name: 'stablecoinMcap',
      value: mcap,
      normalized,
      signal: change > 0.05 ? 'bullish' : change < -0.05 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.15 + 0.85,
      lastUpdate: new Date().toISOString(),
      metadata: {
        usdt: mcap * 0.45,
        usdc: mcap * 0.35,
        dai: mcap * 0.08,
        others: mcap * 0.12,
        change7d: (change * 100).toFixed(2)
      }
    }
  }

  // Generate ETF flows data
  generateEtfFlowsData(): MarketDial {
    const baseFlow = 50_000_000 // $50M baseline daily
    const flowMultiplier = (Math.random() - 0.3) * 4 // Bias toward inflows
    const netFlow = baseFlow * flowMultiplier
    
    // Positive flows = bullish
    const normalized = Math.max(0, Math.min(100, 50 + (flowMultiplier * 15)))
    
    return {
      name: 'etfFlows',
      value: netFlow,
      normalized,
      signal: netFlow > 25_000_000 ? 'bullish' : netFlow < -25_000_000 ? 'bearish' : 'neutral',
      confidence: Math.random() * 0.2 + 0.8,
      lastUpdate: new Date().toISOString(),
      metadata: {
        btcEtfFlows: netFlow * 0.7,
        ethEtfFlows: netFlow * 0.3,
        flow7d: netFlow * 7,
        largestFlow: netFlow * 1.5,
        providers: ['GBTC', 'FBTC', 'BITB', 'ETHE']
      }
    }
  }

  // Generate complete market regime assessment
  generateMarketRegime(): MarketRegime {
    const dials = {
      funding: this.generateFundingData(),
      openInterest: this.generateOpenInterestData(),
      fees: this.generateFeesData(),
      utilizationLending: this.generateLendingUtilizationData(),
      ethStaked: this.generateEthStakedData(),
      stablecoinMcap: this.generateStablecoinMcapData(),
      etfFlows: this.generateEtfFlowsData()
    }

    // Calculate weighted regime score
    const weights = {
      funding: 0.20,
      openInterest: 0.15,
      fees: 0.15,
      utilizationLending: 0.15,
      ethStaked: 0.10,
      stablecoinMcap: 0.10,
      etfFlows: 0.15
    }

    let totalScore = 0
    let totalWeight = 0

    Object.entries(dials).forEach(([key, dial]) => {
      const weight = weights[key as keyof typeof weights]
      totalScore += dial.normalized * dial.confidence * weight
      totalWeight += dial.confidence * weight
    })

    const finalScore = totalScore / totalWeight

    // Determine regime based on score
    let regime: MarketRegime['regime']
    if (finalScore > 65) {
      regime = 'expansion'
    } else if (finalScore < 35) {
      regime = 'compression'
    } else {
      regime = 'neutral'
    }

    return {
      regime,
      score: Math.round(finalScore),
      dials,
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
      previous: Math.random() > 0.8 ? {
        regime: regime === 'expansion' ? 'neutral' : 'expansion',
        changedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
      } : undefined
    }
  }
}

// Regime detection algorithm
export class RegimeDetector {
  private history: MarketRegime[] = []
  private readonly maxHistory = 100
  
  addRegimeReading(regime: MarketRegime): RegimeChangeAlert | null {
    this.history.push(regime)
    
    // Keep only recent history
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory)
    }

    // Check for regime changes
    if (this.history.length < 2) return null

    const current = this.history[this.history.length - 1]
    const previous = this.history[this.history.length - 2]

    if (current.regime !== previous.regime) {
      // Identify which dials triggered the change
      const triggeredBy: string[] = []
      const threshold = 15 // Significant change in dial score

      Object.entries(current.dials).forEach(([key, dial]) => {
        const prevDial = previous.dials[key as keyof typeof previous.dials]
        if (Math.abs(dial.normalized - prevDial.normalized) > threshold) {
          triggeredBy.push(key)
        }
      })

      // Determine significance
      let significance: RegimeChangeAlert['significance'] = 'minor'
      if (Math.abs(current.score - previous.score) > 30) {
        significance = 'critical'
      } else if (Math.abs(current.score - previous.score) > 15) {
        significance = 'major'
      }

      return {
        from: previous.regime,
        to: current.regime,
        confidence: current.score / 100,
        triggeredBy,
        timestamp: current.timestamp,
        significance
      }
    }

    return null
  }

  getCurrentTrend(): 'strengthening' | 'weakening' | 'stable' {
    if (this.history.length < 5) return 'stable'

    const recent = this.history.slice(-5)
    const scores = recent.map(r => r.score)
    
    const avgRecent = scores.slice(-3).reduce((a, b) => a + b, 0) / 3
    const avgOlder = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2

    const difference = avgRecent - avgOlder
    
    if (difference > 5) return 'strengthening'
    if (difference < -5) return 'weakening'
    return 'stable'
  }

  getRegimeStats() {
    const regimeCounts = this.history.reduce((acc, reading) => {
      acc[reading.regime] = (acc[reading.regime] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = this.history.length
    
    return {
      expansion: ((regimeCounts.expansion || 0) / total * 100).toFixed(1),
      compression: ((regimeCounts.compression || 0) / total * 100).toFixed(1),
      neutral: ((regimeCounts.neutral || 0) / total * 100).toFixed(1),
      totalReadings: total,
      currentTrend: this.getCurrentTrend()
    }
  }
}