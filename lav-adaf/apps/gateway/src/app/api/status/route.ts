// ======================================================================================
// LAV/ADAF Gateway - Main Status & Health API
// ======================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { config, features } from '@/config'

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

interface ServiceHealth {
  name: string
  status: HealthStatus
  latency?: number
  lastCheck: string
  details?: Record<string, any>
}

interface SystemStatus {
  status: HealthStatus
  timestamp: string
  version: string
  environment: string
  services: ServiceHealth[]
  features: Record<string, boolean>
  metrics: {
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
}

// Mock service health checks (replace with actual health checks)
async function checkServiceHealth(): Promise<ServiceHealth[]> {
  const services: ServiceHealth[] = []
  
  // Database health
  try {
    // TODO: Replace with actual Postgres health check
    services.push({
      name: 'postgres',
      status: 'healthy',
      latency: Math.floor(Math.random() * 10) + 5,
      lastCheck: new Date().toISOString(),
      details: { connections: 5, maxConnections: 100 }
    })
  } catch (error) {
    services.push({
      name: 'postgres',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      details: { error: 'Connection failed' }
    })
  }
  
  // Redis health
  try {
    // TODO: Replace with actual Redis health check
    services.push({
      name: 'redis',
      status: 'healthy',
      latency: Math.floor(Math.random() * 5) + 1,
      lastCheck: new Date().toISOString(),
      details: { memory: '10MB', connectedClients: 3 }
    })
  } catch (error) {
    services.push({
      name: 'redis',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      details: { error: 'Connection failed' }
    })
  }
  
  // Kafka health
  try {
    // TODO: Replace with actual Kafka health check
    services.push({
      name: 'kafka',
      status: 'healthy',
      latency: Math.floor(Math.random() * 20) + 10,
      lastCheck: new Date().toISOString(),
      details: { topics: 8, brokers: 1 }
    })
  } catch (error) {
    services.push({
      name: 'kafka',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      details: { error: 'Connection failed' }
    })
  }

  // Agent health checks
  const agents = [
    'market-sentinel',
    'executioner', 
    'risk-warden',
    'defi-ranger',
    'basis-maker'
  ]
  
  for (const agent of agents) {
    try {
      // TODO: Replace with actual agent health checks
      const isHealthy = Math.random() > 0.1 // 90% healthy mock
      services.push({
        name: agent,
        status: isHealthy ? 'healthy' : 'degraded',
        latency: Math.floor(Math.random() * 50) + 10,
        lastCheck: new Date().toISOString(),
        details: isHealthy ? { state: 'running' } : { state: 'recovering' }
      })
    } catch (error) {
      services.push({
        name: agent,
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        details: { error: 'Service unreachable' }
      })
    }
  }
  
  return services
}

// Determine overall system health
function determineOverallHealth(services: ServiceHealth[]): HealthStatus {
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
  const degradedCount = services.filter(s => s.status === 'degraded').length
  
  if (unhealthyCount > 0) return 'unhealthy'
  if (degradedCount > 2) return 'degraded'
  return 'healthy'
}

// Get system metrics
function getSystemMetrics() {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
    },
    cpu: {
      usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000) // Convert to percentage approximation
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const services = await checkServiceHealth()
    const overallStatus = determineOverallHealth(services)
    
    const systemStatus: SystemStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.3.0',
      environment: config.NODE_ENV,
      services,
      features: {
        liveTrading: features.liveTrading,
        mlAgents: features.mlAgents,
        governance: features.governance,
        mockData: features.mockData
      },
      metrics: getSystemMetrics()
    }
    
    // Set appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(systemStatus, { status: httpStatus })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle HEAD requests for basic health checks
export async function HEAD(request: NextRequest) {
  try {
    const services = await checkServiceHealth()
    const overallStatus = determineOverallHealth(services)
    
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
                      
    return new NextResponse(null, { status: httpStatus })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}