import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withRateLimit } from '@/middleware/withRateLimit';
import { logger } from '@/lib/logger';
import fs from 'node:fs/promises';
import path from 'node:path';

type Direction = 'gainers' | 'losers' | 'both';

const VALID_WINDOWS = new Set(['1h', '24h', '7d']);
const DEFAULT_WINDOW = '24h';
const DEFAULT_LIMIT = 10;
const DEFAULT_DIRECTION: Direction = 'both';

function createCorrelationId(): string {
  try {
    return randomUUID();
  } catch {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function parseParams(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const window = sp.get('window') ?? DEFAULT_WINDOW;
  const limitStr = sp.get('limit');
  const dirStr = (sp.get('direction') ?? DEFAULT_DIRECTION) as Direction;

  const limitRaw = limitStr ? Number(limitStr) : DEFAULT_LIMIT;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 100) : DEFAULT_LIMIT;

  return { window, limit, direction: dirStr };
}

async function loadMockTopMovers(window: string, limit: number, direction: Direction) {
  const fixturesDir = path.join(process.cwd(), 'services', 'oracle-core', 'mock', 'fixtures', 'vox');
  const file = path.join(fixturesDir, `top-movers.${window}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as { items: any[] } | any[];
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    // basic direction filtering if fixture includes delta
    const filtered = items.filter((it: any) => {
      if (direction === 'both') return true;
      const delta = typeof it.delta === 'number' ? it.delta : 0;
      return direction === 'gainers' ? delta >= 0 : delta < 0;
    });
    return filtered.slice(0, limit);
  } catch (e) {
    // fallback minimal mock
    return [
      { asset: 'btc', vpi_now: 75, vpi_prev: 60, delta: 15, z: 1.2, samples: 120, confidence: 0.82 },
      { asset: 'eth', vpi_now: 62, vpi_prev: 58, delta: 4, z: 0.5, samples: 95, confidence: 0.74 },
    ].slice(0, limit);
  }
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, async (req: NextRequest) => {
    const correlationId = createCorrelationId();
    const start = Date.now();
    const { window, limit, direction } = parseParams(req);

    // RBAC-lite: require Authorization header (maps to oracle.reader in this phase)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      const res = NextResponse.json(
        { error: 'unauthorized', message: 'Bearer token required' },
        { status: 401 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=0');
      return res;
    }

    // Validate params
    if (!VALID_WINDOWS.has(window)) {
      const res = NextResponse.json(
        { error: 'bad_request', message: `Invalid window: ${window}` },
        { status: 400 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=0');
      return res;
    }
    if (!['gainers', 'losers', 'both'].includes(direction)) {
      const res = NextResponse.json(
        { error: 'bad_request', message: `Invalid direction: ${direction}` },
        { status: 400 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=0');
      return res;
    }

    const isMock = process.env.VOX_TOP_MOVERS_MOCK === 'true' || process.env.ORACLE_SOURCE_MODE === 'mock';
    const cacheControl = isMock ? 'private, max-age=0' : 'private, max-age=30';

    try {
      let items: any[] = [];
      if (isMock) {
        items = await loadMockTopMovers(window, limit, direction as Direction);
      } else {
        // Circuit breaker: currently not wired to TSDB provider — fail fast with 503
        const res = NextResponse.json(
          { error: 'circuit_open', message: 'Top movers data source not available (shadow/dry-run only)' },
          { status: 503 }
        );
        res.headers.set('X-Correlation-Id', correlationId);
        res.headers.set('Cache-Control', cacheControl);
        return res;
      }

      logger.info('vox.top-movers served', {
        correlationId,
        window,
        limit,
        direction,
        durationMs: Date.now() - start,
      });

      const res = NextResponse.json(
        { window, limit, direction, items },
        { status: 200 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', cacheControl);
      return res;
    } catch (error) {
      logger.error('vox.top-movers failed', { correlationId, message: (error as Error).message });
      const res = NextResponse.json(
        { error: 'internal_error', message: 'Failed to compute top movers' },
        { status: 500 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=0');
      return res;
    }
  });
}
