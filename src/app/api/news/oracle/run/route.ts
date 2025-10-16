import { NextRequest } from 'next/server';
import { runNewsOracle } from '@/lib/news/orchestrator/orchestrator';
import { requirePermission } from '@/lib/auth/rbac';
import type { PipelineConfig } from '@/lib/news/types';

const FEATURE_ENABLED = process.env.NEXT_PUBLIC_FF_NEWS_ORACLE_ENABLED === 'true';

export async function POST(req: NextRequest) {
  if (!FEATURE_ENABLED) {
    return new Response(JSON.stringify({ error: 'feature_disabled' }), {
      status: 404,
    });
  }

  try {
    await requirePermission('feature:news_oracle');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'forbidden';
    return new Response(JSON.stringify({ error: message }), { status: 403 });
  }

  let overrides: Partial<PipelineConfig> = {};
  try {
    const body = await req.json();
    if (body && typeof body === 'object') {
      const { maxItems, standbyMinutes } = body as Partial<PipelineConfig>;
      overrides = {
        maxItems: typeof maxItems === 'number' ? maxItems : undefined,
        standbyMinutes:
          typeof standbyMinutes === 'number' ? standbyMinutes : undefined,
      };
    }
  } catch {
    // ignore if body is empty or invalid JSON
  }

  try {
    const result = await runNewsOracle(overrides);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
