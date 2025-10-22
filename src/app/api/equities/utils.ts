import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getEquitiesRuntimeConfig } from '@/lib/equities/config';
import type { EquitiesProviderContext } from '@/lib/equities/types';
import { requirePermission } from '@/lib/auth/rbac';
import { recordApiHit } from '@/lib/equities/metrics';

export interface EquitiesApiContext {
  runtime: ReturnType<typeof getEquitiesRuntimeConfig>;
  providerContext: EquitiesProviderContext;
}

export async function enforceEquitiesAccess(
  request: NextRequest,
  route: string
): Promise<EquitiesApiContext | NextResponse> {
  const runtime = getEquitiesRuntimeConfig();

  if (!runtime.featureEnabled) {
    recordApiHit(route, 404);
    return NextResponse.json(
      {
        error: 'feature_disabled',
        message: 'Equities AI sleeve is not enabled for this environment.',
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  try {
    await requirePermission('feature:equities-ai');
  } catch (error) {
    recordApiHit(route, 403);
    return NextResponse.json(
      {
        error: 'forbidden',
        message: 'You do not have access to Equities AI sleeve.',
      },
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const providerContext: EquitiesProviderContext = {
    dryRun: runtime.dryRun,
    cacheTtlMs: runtime.cacheTtlMs,
    now: () => new Date(),
    abortSignal: request.signal,
  };

  return { runtime, providerContext };
}

export function handleApiError(
  route: string,
  error: unknown,
  status = 500
): NextResponse {
  console.error(`[Equities API] ${route} failed`, error);
  recordApiHit(route, status);

  return NextResponse.json(
    {
      error: 'internal_error',
      message: 'Unexpected error while processing equities request.',
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export function buildSuccessResponse<T>(
  route: string,
  runtime: ReturnType<typeof getEquitiesRuntimeConfig>,
  payload: T,
  extraHeaders: Record<string, string> = {}
): NextResponse<T> {
  recordApiHit(route, 200);

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': `public, s-maxage=${Math.floor(runtime.cacheTtlMs / 1000)}, stale-while-revalidate=30`,
      'X-Equities-Dry-Run': String(runtime.dryRun),
      ...extraHeaders,
    },
  });
}
