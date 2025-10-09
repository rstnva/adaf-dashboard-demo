import { NextRequest, NextResponse } from 'next/server'

// Data contract: GammaPoint by tenor
type GammaPoint = {
  strike: number
  gamma: number
}

type GammaResponse = {
  tenor7: GammaPoint[]
  tenor14: GammaPoint[]
  tenor30: GammaPoint[]
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const assetParam = url.searchParams.get('asset') || 'BTC'
    
    // Validate params
    const asset = ['BTC', 'ETH'].includes(assetParam.toUpperCase()) ? assetParam.toUpperCase() : 'BTC'
    
    // Generate mock gamma data
    function generateGammaPoints(tenor: string, basePrice: number): GammaPoint[] {
      const points: GammaPoint[] = []
      const multiplier = tenor === '7d' ? 1.0 : tenor === '14d' ? 0.8 : 0.6
      
      // Generate gamma points around current price
      for (let i = -10; i <= 10; i++) {
        const strike = Math.round(basePrice * (1 + (i * 0.05))) // ±50% range in 5% steps
        const distance = Math.abs(strike - basePrice) / basePrice
        
        // Gamma is highest near ATM and decreases with distance
        const maxGamma = asset === 'BTC' ? 0.005 : 0.008
        const gamma = maxGamma * multiplier * Math.exp(-Math.pow(distance * 4, 2))
        
        points.push({
          strike,
          gamma: Number(gamma.toFixed(6))
        })
      }
      
      return points.sort((a, b) => a.strike - b.strike)
    }
    
    const basePrice = asset === 'BTC' ? 67000 : 2450
    
    const data: GammaResponse = {
      tenor7: generateGammaPoints('7d', basePrice),
      tenor14: generateGammaPoints('14d', basePrice),
      tenor30: generateGammaPoints('30d', basePrice)
    }
    
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'internal error' }, 
      { status: 500 }
    )
  }
}