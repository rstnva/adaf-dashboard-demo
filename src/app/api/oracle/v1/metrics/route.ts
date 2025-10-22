import { register, collectDefaultMetrics } from 'prom-client';
import type { NextRequest } from 'next/server';

// Collect default Node.js metrics (heap, CPU, event loop, etc.)
collectDefaultMetrics({ prefix: 'oracle_' });

/**
 * Prometheus metrics exporter endpoint.
 * Exposes all registered oracle metrics in Prometheus text format.
 * 
 * @example
 * GET /api/oracle/v1/metrics
 * Content-Type: text/plain; version=0.0.4; charset=utf-8
 * 
 * # HELP oracle_ingest_total Total ingestion attempts
 * # TYPE oracle_ingest_total counter
 * oracle_ingest_total{feed="price/btc_usd.live"} 1234
 * ...
 */
export async function GET(_request: NextRequest) {
  try {
    const metrics = await register.metrics();
    
    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('[oracle-metrics-exporter] Failed to collect metrics:', error);
    
    return new Response('Failed to collect metrics', {
      status: 500,
    });
  }
}

/**
 * Metadata endpoint for Prometheus service discovery.
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'X-Metrics-Available': 'true',
      'X-Oracle-Version': '1.0.0',
    },
  });
}
