import { NextRequest, NextResponse } from 'next/server'
import { recordIntegrationClick } from '@/metrics/wsp.metrics'

export async function POST(req: NextRequest) {
  try {
    const { provider, widget } = await req.json()
    
    if (!provider || !widget) {
      return NextResponse.json(
        { error: 'Missing provider or widget' },
        { status: 400 }
      )
    }
    
    // Record the click in metrics
    recordIntegrationClick(provider, widget)
    
    return NextResponse.json(
      { success: true, provider, widget },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Metrics] Integration click error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}