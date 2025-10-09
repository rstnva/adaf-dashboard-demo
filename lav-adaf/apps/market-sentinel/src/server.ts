// ======================================================================================
// Market Sentinel - Main Server
// ======================================================================================
// Real-time market regime detection with <60s latency requirement
// Publishes regime changes to Kafka signals.regime topic
// ======================================================================================

import express from 'express'
import cron from 'node-cron'
import { createLogger, format, transports } from 'winston'
import { MarketRegime, RegimeChangeAlert, MockDataGenerator, RegimeDetector } from './regime-detector'

const app = express()
const PORT = process.env.PORT || 3010

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
})

// Application state
let currentRegime: MarketRegime | null = null
let lastUpdate: string = ''
let processedCount = 0
let alertCount = 0

const mockGenerator = MockDataGenerator.getInstance()
const regimeDetector = new RegimeDetector()

// Middleware
app.use(express.json())
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  next()
})

// ======================================================================================
// CORE REGIME PROCESSING
// ======================================================================================

async function processMarketRegime(): Promise<void> {
  try {
    const startTime = Date.now()
    
    // Generate new regime reading
    const newRegime = mockGenerator.generateMarketRegime()
    currentRegime = newRegime
    lastUpdate = new Date().toISOString()
    processedCount++

    // Check for regime changes
    const alert = regimeDetector.addRegimeReading(newRegime)
    
    if (alert) {
      alertCount++
      logger.warn('Regime change detected', {
        alert,
        processing_time_ms: Date.now() - startTime
      })

      // TODO: Publish to Kafka signals.regime topic
      await publishRegimeChange(alert, newRegime)
    }

    const processingTime = Date.now() - startTime
    
    logger.info('Regime processed successfully', {
      regime: newRegime.regime,
      score: newRegime.score,
      processing_time_ms: processingTime,
      total_processed: processedCount,
      alerts_generated: alertCount
    })

    // DoD: Ensure latency <60s (this should be <1s for processing)
    if (processingTime > 5000) {
      logger.error('Processing time exceeded threshold', {
        processing_time_ms: processingTime,
        threshold_ms: 5000
      })
    }

  } catch (error) {
    logger.error('Failed to process market regime', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

async function publishRegimeChange(alert: RegimeChangeAlert, regime: MarketRegime): Promise<void> {
  try {
    // TODO: Implement actual Kafka publishing
    // For now, just log the event
    logger.info('Publishing regime change event', {
      topic: 'signals.regime',
      alert,
      regime: {
        regime: regime.regime,
        score: regime.score,
        timestamp: regime.timestamp
      }
    })

    // Mock Kafka message structure
    const kafkaMessage = {
      key: `regime-change-${Date.now()}`,
      value: JSON.stringify({
        type: 'regime_change',
        timestamp: new Date().toISOString(),
        alert,
        regime: {
          current: regime.regime,
          score: regime.score,
          dials: Object.entries(regime.dials).reduce((acc, [key, dial]) => {
            acc[key] = {
              value: dial.normalized,
              signal: dial.signal,
              confidence: dial.confidence
            }
            return acc
          }, {} as Record<string, any>)
        }
      }),
      headers: {
        source: 'market-sentinel',
        version: '1.3.0',
        significance: alert.significance
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    
    logger.info('Regime change published successfully', {
      messageKey: kafkaMessage.key,
      significance: alert.significance
    })

  } catch (error) {
    logger.error('Failed to publish regime change', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// ======================================================================================
// API ENDPOINTS
// ======================================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime()
  const memoryUsage = process.memoryUsage()
  
  res.json({
    status: 'healthy',
    service: 'market-sentinel',
    version: '1.3.0',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    metrics: {
      processed_count: processedCount,
      alert_count: alertCount,
      last_update: lastUpdate,
      current_regime: currentRegime?.regime || 'unknown'
    },
    timestamp: new Date().toISOString()
  })
})

// Get current market regime
app.get('/api/regime/current', (req, res) => {
  if (!currentRegime) {
    return res.status(503).json({
      error: 'No regime data available yet',
      message: 'Market Sentinel is still initializing'
    })
  }

  res.json({
    regime: currentRegime,
    stats: regimeDetector.getRegimeStats(),
    metadata: {
      processed_count: processedCount,
      alert_count: alertCount,
      last_update: lastUpdate
    }
  })
})

// Get individual dial data
app.get('/api/dials/:dialName', (req, res) => {
  const { dialName } = req.params
  
  if (!currentRegime) {
    return res.status(503).json({
      error: 'No regime data available yet'
    })
  }

  const validDials = Object.keys(currentRegime.dials)
  if (!validDials.includes(dialName)) {
    return res.status(400).json({
      error: 'Invalid dial name',
      valid_dials: validDials
    })
  }

  const dial = currentRegime.dials[dialName as keyof typeof currentRegime.dials]
  
  res.json({
    dial,
    regime_context: {
      current_regime: currentRegime.regime,
      overall_score: currentRegime.score
    }
  })
})

// Get regime statistics and trends
app.get('/api/regime/stats', (req, res) => {
  const stats = regimeDetector.getRegimeStats()
  
  res.json({
    stats,
    metrics: {
      total_processed: processedCount,
      alerts_generated: alertCount,
      uptime_minutes: Math.floor(process.uptime() / 60),
      average_processing_time: '< 1s' // TODO: Calculate actual average
    }
  })
})

// Force regime recalculation (for testing)
app.post('/api/regime/recalculate', async (req, res) => {
  try {
    logger.info('Manual regime recalculation requested')
    await processMarketRegime()
    
    res.json({
      success: true,
      message: 'Regime recalculated successfully',
      current_regime: currentRegime?.regime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Manual recalculation failed', { error })
    res.status(500).json({
      success: false,
      error: 'Recalculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ======================================================================================
// SCHEDULED PROCESSING
// ======================================================================================

// Process regime every 30 seconds (DoD: <60s latency)
const regimeProcessingJob = cron.schedule('*/30 * * * * *', async () => {
  await processMarketRegime()
}, {
  scheduled: false // Don't start immediately
})

// ======================================================================================
// SERVER STARTUP
// ======================================================================================

async function startServer(): Promise<void> {
  try {
    // Initial regime calculation
    logger.info('Market Sentinel starting up...')
    await processMarketRegime()
    
    // Start scheduled processing
    regimeProcessingJob.start()
    logger.info('Regime processing scheduler started (30s intervals)')
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Market Sentinel listening on port ${PORT}`, {
        service: 'market-sentinel',
        version: '1.3.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
          'GET /health',
          'GET /api/regime/current', 
          'GET /api/dials/:dialName',
          'GET /api/regime/stats',
          'POST /api/regime/recalculate'
        ]
      })
    })

  } catch (error) {
    logger.error('Failed to start Market Sentinel', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  regimeProcessingJob.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully') 
  regimeProcessingJob.stop()
  process.exit(0)
})

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Startup failed', { error })
    process.exit(1)
  })
}

export { app, processMarketRegime }