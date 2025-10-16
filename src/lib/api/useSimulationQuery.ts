"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { useFeatureFlag, FeatureFlagName } from "@/lib/featureFlags";
import { hasPermission, Permission } from "@/lib/auth/rbac";

export interface SimulationError extends Error {
  status?: number;
  meta?: Record<string, unknown>;
}

interface UseSimulationQueryOptions {
  queryKey: readonly unknown[];
  endpoint: string;
  body?: unknown;
  flag: FeatureFlagName;
  permission: Permission;
  /**
   * Additional enable control besides flag/permission gating
   */
  enabled?: boolean;
  /**
   * Optional refetch interval in ms. Defaults to 2 minutes when omitted.
   */
  refetchInterval?: number;
  /**
   * Optional stale time for the query result. Defaults to 30 seconds.
   */
  staleTime?: number;
}

async function postSimulation<TData>(endpoint: string, body?: unknown): Promise<TData> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Simulation request failed (${response.status})`;
    let meta: Record<string, unknown> | undefined;

    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
      if (payload?.meta && typeof payload.meta === "object") {
        meta = payload.meta as Record<string, unknown>;
      }
    } catch (error) {
      // ignore JSON parse error, fall back to default message
    }

    const error = new Error(errorMessage) as SimulationError;
    error.status = response.status;
    error.meta = meta;
    throw error;
  }

  return (await response.json()) as TData;
}

export function useSimulationQuery<TData>({
  queryKey,
  endpoint,
  body,
  flag,
  permission,
  enabled = true,
  refetchInterval = 2 * 60 * 1000,
  staleTime = 30 * 1000,
}: UseSimulationQueryOptions): UseQueryResult<TData> & {
  flagEnabled: boolean;
  permissionGranted: boolean;
} {
  const flagEnabled = useFeatureFlag(flag);
  const permissionGranted = hasPermission(permission);
  const gateEnabled = enabled && flagEnabled && permissionGranted;

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => postSimulation<TData>(endpoint, body),
    enabled: gateEnabled,
    refetchInterval,
    staleTime,
  });

  return Object.assign(query, {
    flagEnabled,
    permissionGranted,
  });
}
