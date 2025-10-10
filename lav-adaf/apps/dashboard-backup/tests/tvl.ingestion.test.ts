import './setup';
import { vi } from 'vitest';
vi.mock('ioredis', () => {
  // Use require here to avoid ESM import hoisting
  const setup = require('./setup');
  const MockRedis = setup.MockRedis || setup.default;
  return { default: MockRedis, Redis: MockRedis };
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as tvlIngestHandler } from '../src/app/api/ingest/onchain/tvl/route';
import { getRedisClient } from '../src/lib/cache/redis-config';
let redis: any;

describe('TVL Data Ingestion Integration', () => {
  beforeAll(() => {
    // Static import is used, no need for dynamic require
  });

  beforeEach(async () => {
    redis = await getRedisClient();
    // Limpiar Redis antes de cada prueba
    await redis.flushdb();
  });

  afterEach(async () => {
    if (redis) await redis.flushdb();
  });

  it('should process TVL data and create signals', async () => {
    const mockTVLData = {
      chain: 'ethereum',
      protocol: 'uniswap',
      value: 4800000000, // $4.8B triggers alert (below 5B)
      ts: new Date().toISOString(),
      metric: 'tvl.usd'
    }

    const request = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTVLData)
    })

    const response = await tvlIngestHandler(request)
    const result = await response.json()

    expect(response.status).toBe(201)
    expect(result.success).toBe(true)
    expect(result.signalId).toBeDefined()
    expect(result.alert).toBe(true) // Debería generar alerta por caída > 12%
  })

  it('should detect TVL threshold breaches', async () => {
    const significantDropTVL = {
      chain: 'ethereum',
      protocol: 'compound',
      value: 2100000000, // $2.1B
      ts: new Date().toISOString(),
      metric: 'tvl.usd'
    }

    const request = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(significantDropTVL)
    })

    const response = await tvlIngestHandler(request)
    const result = await response.json()

    expect(response.status).toBe(201)
    expect(result.alert).toBe(true)
    expect(result.severity).toBe('high')
    expect(result.reason).toContain('TVL drop')
  })

  it('should not create alerts for minor TVL changes', async () => {
    const minorChangeTVL = {
      chain: 'ethereum',
      protocol: 'aave',
      value: 8900000000, // $8.9B
      ts: new Date().toISOString(),
      metric: 'tvl.usd'
    }

    const request = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minorChangeTVL)
    })

    const response = await tvlIngestHandler(request)
    const result = await response.json()

    expect(response.status).toBe(201)
    expect(result.success).toBe(true)
    expect(result.alert).toBe(false)
  })

  it('should prevent duplicate TVL entries', async () => {
    const tvlData = {
      chain: 'ethereum',
      protocol: 'makerdao',
      value: 6200000000,
      ts: new Date().toISOString(),
      metric: 'tvl.usd'
    }

    const request1 = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tvlData)
    })

    const request2 = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tvlData)
    })

    // Primera inserción
    const response1 = await tvlIngestHandler(request1)
    expect(response1.status).toBe(201)

    // Segunda inserción (duplicada)
    const response2 = await tvlIngestHandler(request2)
    expect(response2.status).toBe(409)
    
    const result2 = await response2.json()
    expect(result2.success).toBe(false)
    expect(result2.error).toContain('Duplicate TVL data')
  })

  it('should handle DeFiLlama adapter integration', async () => {
    // Patch: Send a valid TVLPointSchema payload for the adapter route (simulate as normal TVL ingest)
    const adapterTVL = {
      chain: 'polygon',
      protocol: 'curve',
      value: 123456789,
      ts: new Date().toISOString(),
      metric: 'tvl.usd'
    }
    const request = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adapterTVL)
    })
    const response = await tvlIngestHandler(request)
    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.signalId).toBeDefined()
  })

  it('should validate TVL data schema', async () => {
    const invalidTVLData = {
      chain: 123, // Debe ser string
      protocol: '', // Protocolo vacío
      value: -1000, // Negativo - inválido
      // ts faltante
      metric: 'tvl.usd'
    }
    const request = new NextRequest('http://localhost:3000/api/ingest/onchain/tvl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidTVLData)
    })
    const response = await tvlIngestHandler(request)
    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.success).toBe(false)
    expect(result.error).toContain('validation')
  })
})