import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { getSafeRedis } from '@/lib/safe-redis'

const prisma = new PrismaClient()

// Redis opcional via safe wrapper - fallback a memoria en MOCK_MODE o error
const redis = getSafeRedis()

// Fallback in-memory storage for deduplication
const inMemoryDedup = new Set<string>()

// Schema de validación para NewsItem
const NewsItemSchema = z.object({
  source: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  published_at: z.string().datetime(),
  category: z.string().optional(),
  summary: z.string().optional(),
  tickers: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([])
})

// Generar fingerprint para deduplicación
function generateFingerprint(item: z.infer<typeof NewsItemSchema>): string {
  const publishedAt = new Date(item.published_at).toISOString()
  const base = `${item.source}|${item.title.trim().toLowerCase()}|${item.url}|${publishedAt}`
  return crypto.createHash('sha256').update(base).digest('hex')
}

// Clasificar severidad basada en keywords
function classifySeverity(title: string, summary?: string): 'low' | 'med' | 'high' {
  const text = `${title} ${summary || ''}`.toLowerCase()
  
  // Palabras críticas
  if (['hack', 'exploit', 'breach', 'depeg', 'halt'].some(k => text.includes(k))) {
    return 'high'
  }
  
  // Palabras regulatorias/macro
  if (['sec', 'cnbv', 'banxico', 'cpi', 'fomc', 'rate', 'etf'].some(k => text.includes(k))) {
    return 'med'
  }
  
  return 'low'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const item = NewsItemSchema.parse(body)
    
    // Generar fingerprint para deduplicación
    const fingerprint = generateFingerprint(item)
    
    // Verificar duplicados con Redis o fallback in-memory
    let isDuplicate = false
    
    try {
      // Emular setnx con get+setex si no está disponible
      const key = `dedupe:news:${fingerprint}`
      const existing = await (redis as any).get(key)
      if (existing) {
        isDuplicate = true
      } else {
        await ((redis as any).setex ? (redis as any).setex(key, 6 * 3600, '1') : (async () => { await (redis as any).set(key, '1'); await (redis as any).expire(key, 6 * 3600) })())
        isDuplicate = false
      }
    } catch (error) {
      console.warn('Redis error, using in-memory deduplication:', error)
      isDuplicate = inMemoryDedup.has(fingerprint)
      if (!isDuplicate) {
        inMemoryDedup.add(fingerprint)
      }
    }
    
    if (isDuplicate) {
      return NextResponse.json({
        status: 'duplicate',
        hash: fingerprint
      })
    }
    
    // Clasificar severidad
    const severity = classifySeverity(item.title, item.summary)
    
    // Preparar payload
    const payload = {
      title: item.title,
      url: item.url,
      summary: item.summary,
      category: item.category,
      tickers: item.tickers,
      keywords: item.keywords
    }
    
    // Insertar señal usando el schema actual (severity requerido en schema Prisma)
    await prisma.signal.create({
      data: {
        type: 'news',
        source: item.source,
        title: item.title,
        description: item.summary || item.title,
        severity,
        metadata: payload,
        fingerprint,
        timestamp: new Date(item.published_at)
      }
    })
    
    return NextResponse.json({
      status: 'ok',
      hash: fingerprint,
      severity
    })
    
  } catch (error) {
    console.error('Error processing news:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}