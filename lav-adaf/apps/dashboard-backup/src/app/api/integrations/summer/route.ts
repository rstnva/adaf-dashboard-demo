import { NextResponse } from 'next/server'
import { recordApiHit } from '@/metrics/wsp.metrics'
import { hasPermission } from '@/lib/auth/rbac'
import { LAZY_VAULTS, MULTIPLY_POSITIONS, SUMMER_SOURCE_DOCS } from '@/lib/integrations/summer/links'

export async function GET() {
  try {
    // Check feature flag
    const summerEnabled = process.env.NEXT_PUBLIC_FF_SUMMER_ENABLED === 'true'
    if (!summerEnabled) {
      return NextResponse.json({ 
        error: 'Summer.fi integration is disabled',
        enabled: false 
      }, { status: 404 })
    }

    // Check RBAC permission
    try {
      hasPermission('feature:summer')
    } catch (error) {
      return NextResponse.json({ 
        error: 'Missing required permission: feature:summer',
        permission: 'feature:summer'
      }, { status: 403 })
    }

    // Record API hit for metrics (no cache - static metadata)
    const startTime = Date.now()
    
    // Return static metadata (v0)
    const response = {
      enabled: true,
      version: 'v0',
      lazyVaults: LAZY_VAULTS,
      multiply: MULTIPLY_POSITIONS,
      sourceDocs: SUMMER_SOURCE_DOCS,
      metadata: {
        provider: 'Summer.fi',
        type: 'readonly-integration',
        features: ['lazy-vaults', 'multiply-automation'],
        lastUpdated: new Date().toISOString(),
        executionMode: 'read-only-deeplinks'
      }
    }

    const duration = Date.now() - startTime
    
    // Record metrics
    recordApiHit('/api/integrations/summer', 200, duration)
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Integration-Provider': 'Summer.fi',
        'X-Response-Time': duration.toString()
      }
    })

  } catch (error) {
    console.error('[Summer API] Error:', error)
    
    // Record error metrics  
    recordApiHit('/api/integrations/summer', 500, Date.now())
    
    return NextResponse.json({ 
      error: 'Internal server error',
      enabled: false 
    }, { status: 500 })
  }
}