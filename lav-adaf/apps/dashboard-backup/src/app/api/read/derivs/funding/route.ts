import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const assetParam = searchParams.get('asset') || 'BTC'
    const daysParam = searchParams.get('days') || '14'
    
    const asset = ['BTC', 'ETH'].includes(assetParam.toUpperCase()) ? assetParam.toUpperCase() : 'BTC'
    const days = Math.min(Math.max(Number(daysParam), 1), 60)
    
    const exchanges = ['Binance', 'Bybit', 'OKX', 'Deribit']
    const data = []
    
    for (let d = 0; d < days; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)
      const dateStr = date.toISOString().split('T')[0]
      
      for (const exchange of exchanges) {
        const baseRate = asset === 'BTC' ? 0.01 : 0.015
        const variation = (Math.random() - 0.5) * 0.5
        const dailyRate = baseRate * (1 + variation) / 365
        
        data.push({
          date: dateStr,
          exchange,
          window: '8h',
          fundingRate: Number((dailyRate * 100).toFixed(4))
        })
        
        if (exchange === 'Deribit') {
          data.push({
            date: dateStr,
            exchange,
            window: '1d',
            fundingRate: Number((dailyRate * 3 * 100).toFixed(4))
          })
        }
      }
    }
    
    data.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return a.exchange.localeCompare(b.exchange)
    })
    
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'internal error' }, 
      { status: 500 }
    )
  }
}
