import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withRateLimit } from '@/middleware/withRateLimit';

function createCorrelationId(): string {
  try {
    return randomUUID();
  } catch {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, async (req: NextRequest) => {
    const correlationId = createCorrelationId();
    try {
      const origin = new URL(req.url).origin;
      const url = `${origin}/api/healthz?probe=ready&deep=true`;
      const r = await fetch(url, { headers: { 'X-Correlation-Id': correlationId } });
      const json = await r.json().catch(() => ({ status: 'unhealthy', checks: {} }));

      const healthy = json.status === 'healthy' || json.status === 'degraded';
      const slo = {
        stale_ratio_p95: 0,
        shadow_rmse_max: 0,
        read_latency_p95: 0,
        quorum_fail_24h: 0,
      };
      const payload = {
        status: healthy ? 'READY' : 'NOT_READY',
        reasons: healthy ? [] : ['unhealthy'],
        checks: json.checks ?? {},
        slo,
      };

      const res = NextResponse.json(payload, { status: healthy ? 200 : 503 });
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=5');
      return res;
    } catch (error) {
      const res = NextResponse.json(
        { status: 'NOT_READY', reasons: ['exception'], error: (error as Error).message },
        { status: 503 }
      );
      res.headers.set('X-Correlation-Id', correlationId);
      res.headers.set('Cache-Control', 'private, max-age=0');
      return res;
    }
  });
}
