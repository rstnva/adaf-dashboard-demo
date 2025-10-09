import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const rangeParam = url.searchParams.get('range') || '7D'
    
    // Parse days from range parameter
    const rangeToDays: Record<string, number> = {
      '1D': 1,
      '7D': 7,
      '30D': 30,
      '90D': 90
    }
    const days = rangeToDays[rangeParam] || 7

    // Generate mock data for the requested range
    function generateMockFlowData(asset: string, days: number) {
      const data = []
      let cumulative = 0
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // Generate realistic flow data
        const baseFlow = asset === 'BTC' ? 50000000 : 25000000 // Base flow in USD
        const variation = (Math.random() - 0.5) * 0.8 // ±40% variation
        const dailyFlow = Math.round(baseFlow * (1 + variation))
        
        cumulative += dailyFlow
        
        data.push({
          date: dateStr,
          dailyNetInflow: dailyFlow,
          cumNetInflow: cumulative
        })
      }
      
      return data
    }

    const out = {
      BTC: generateMockFlowData('BTC', days),
      ETH: generateMockFlowData('ETH', days)
    }

    return NextResponse.json(out)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
