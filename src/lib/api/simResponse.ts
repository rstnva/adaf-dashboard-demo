import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { recordApiHit } from '@/metrics/wsp.metrics';
import { EXECUTION_CONFIG } from '@/lib/config/execution';

const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Data-Mode': 'sim-only',
} as const;

export function createCorrelationId() {
  try {
    return randomUUID();
  } catch {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function buildHeaders(
  correlationId: string,
  durationMs: number,
  extraHeaders?: Record<string, string>
) {
  return {
    ...BASE_HEADERS,
    'X-Correlation-Id': correlationId,
    'X-Execution-Mode': EXECUTION_CONFIG.mode,
    'X-Response-Time': String(durationMs),
    ...extraHeaders,
  };
}

export function simSuccess<T>(
  route: string,
  correlationId: string,
  startTime: number,
  payload: T,
  headers?: Record<string, string>
) {
  const durationMs = Date.now() - startTime;
  recordApiHit(route, 200, durationMs);

  return NextResponse.json(
    {
      ...((payload as object) || {}),
      meta: {
        correlationId,
        durationMs,
        executionMode: EXECUTION_CONFIG.mode,
      },
    },
    {
      status: 200,
      headers: buildHeaders(correlationId, durationMs, headers),
    }
  );
}

export function simError(
  route: string,
  correlationId: string,
  startTime: number,
  status: number,
  error: string,
  details?: Record<string, unknown>,
  headers?: Record<string, string>
) {
  const durationMs = Date.now() - startTime;
  recordApiHit(route, status, durationMs);

  return NextResponse.json(
    {
      error,
      meta: {
        correlationId,
        durationMs,
        executionMode: EXECUTION_CONFIG.mode,
        ...details,
      },
    },
    {
      status,
      headers: buildHeaders(correlationId, durationMs, headers),
    }
  );
}

export function flagDisabled(
  route: string,
  correlationId: string,
  startTime: number,
  flag: string
) {
  return simError(route, correlationId, startTime, 404, 'Feature flag disabled', {
    flag,
  });
}

export function permissionDenied(
  route: string,
  correlationId: string,
  startTime: number,
  permission: string
) {
  return simError(route, correlationId, startTime, 403, 'Missing required permission', {
    permission,
  });
}

export function modeViolation(
  route: string,
  correlationId: string,
  startTime: number,
  requiredMode: string
) {
  return simError(route, correlationId, startTime, 409, 'Operation not allowed in current execution mode', {
    requiredMode,
    currentMode: EXECUTION_CONFIG.mode,
  });
}
