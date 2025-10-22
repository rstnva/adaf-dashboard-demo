"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { hasPermission } from "@/lib/auth/rbac";
import {
  useFeatureFlag,
  type FeatureFlagName,
} from "@/lib/featureFlags";
import type {
  EquitiesBacktestRequest,
  EquitiesBacktestResult,
  EquityEtfFlowSnapshot,
  EquityFundamentalSnapshot,
  EquityInstitutionalOwnership,
  EquityPriceSnapshot,
  EquityRecommendationPackage,
  EquitySleeveState,
  EquitySignal,
} from "@/lib/equities";

const EQUITIES_FLAG = "FF_EQUITIES_AI_ENABLED" satisfies FeatureFlagName;
const EQUITIES_DRY_RUN_FLAG = "FF_EQUITIES_AI_DRY_RUN" satisfies FeatureFlagName;
const EQUITIES_PERMISSION = "feature:equities-ai" as const;

export interface EquitiesFundamentalsResponse {
  tickers: string[];
  dryRun: boolean;
  fundamentals: EquityFundamentalSnapshot[];
  prices: EquityPriceSnapshot[];
}

export interface EquitiesSignalsResponse {
  tickers: string[];
  dryRun: boolean;
  macroRegime: string;
  signals: EquitySignal[];
}

export interface EquitiesRecommendationsResponse {
  tickers: string[];
  dryRun: boolean;
  sleeveState: EquitySleeveState;
  recommendation: EquityRecommendationPackage;
  signals: EquitySignal[];
  fundamentals: Record<string, EquityFundamentalSnapshot>;
  prices: Record<string, EquityPriceSnapshot>;
  etfFlows: EquityEtfFlowSnapshot[];
  ownership: EquityInstitutionalOwnership[];
}

export interface EquitiesBacktestResponse {
  dryRun: boolean;
  result: EquitiesBacktestResult;
}

export interface EquitiesQueryState {
  flagEnabled: boolean;
  permissionGranted: boolean;
  dryRunFallback: boolean;
}

export class EquitiesApiError extends Error {
  status: number;
  payload: unknown;
  dryRun?: boolean;

  constructor(message: string, status: number, payload?: unknown, dryRun?: boolean) {
    super(message);
    this.name = "EquitiesApiError";
    this.status = status;
    this.payload = payload;
    this.dryRun = dryRun;
  }
}

interface FetchResponse<T> {
  data: T;
  dryRun: boolean;
}

async function fetchEquitiesEndpoint<T>(input: RequestInfo, init: RequestInit = {}): Promise<FetchResponse<T>> {
  const response = await fetch(input, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.method === "POST" ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const rawText = await response.text();
  let parsed: any = undefined;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error("Failed to parse equities API payload", error);
    }
  }

  const dryRunHeader = response.headers.get("X-Equities-Dry-Run");
  const dryRun = typeof parsed?.dryRun === "boolean" ? parsed.dryRun : dryRunHeader === "true";

  if (!response.ok) {
    const message = parsed?.message ?? parsed?.error ?? `Equities API request failed (${response.status})`;
    throw new EquitiesApiError(message, response.status, parsed, dryRun);
  }

  return {
    data: (parsed ?? {}) as T,
    dryRun,
  };
}

function normalizeTickers(input: readonly string[] | undefined): string[] {
  if (!input?.length) {
    return [];
  }

  const unique = new Set<string>();
  input.forEach((ticker) => {
    if (typeof ticker === "string" && ticker.trim().length > 0) {
      unique.add(ticker.trim().toUpperCase());
    }
  });

  return Array.from(unique).sort();
}

function useEquitiesGate(enabled: boolean | undefined): EquitiesQueryState & { gateEnabled: boolean } {
  const flagEnabled = useFeatureFlag(EQUITIES_FLAG);
  const dryRunFallback = useFeatureFlag(EQUITIES_DRY_RUN_FLAG);
  const permissionGranted = hasPermission(EQUITIES_PERMISSION);
  const gateEnabled = Boolean((enabled ?? true) && flagEnabled && permissionGranted);

  return {
    flagEnabled,
    permissionGranted,
    dryRunFallback,
    gateEnabled,
  };
}

type EquitiesFundamentalsOptions = {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
};

type EquitiesSignalsOptions = EquitiesFundamentalsOptions & {
  macroRegime?: "risk-on" | "risk-off" | "neutral";
};

type EquitiesRecommendationsOptions = EquitiesFundamentalsOptions & {
  macroRegime?: "risk-on" | "risk-off" | "neutral";
  configurationId?: string;
};

export function useEquitiesFundamentals(
  tickers: readonly string[],
  options: EquitiesFundamentalsOptions = {}
): UseQueryResult<EquitiesFundamentalsResponse> & EquitiesQueryState {
  const normalizedTickers = useMemo(() => normalizeTickers(tickers), [tickers]);
  const gate = useEquitiesGate(options.enabled !== false && normalizedTickers.length > 0);

  const query = useQuery<EquitiesFundamentalsResponse>({
    queryKey: ["equities", "fundamentals", normalizedTickers],
    queryFn: async () => {
      const params = new URLSearchParams({ tickers: normalizedTickers.join(",") });
      const { data, dryRun } = await fetchEquitiesEndpoint<EquitiesFundamentalsResponse>(
        `/api/equities/fundamentals?${params.toString()}`
      );
      return { ...data, dryRun: data.dryRun ?? dryRun };
    },
    enabled: gate.gateEnabled,
    refetchInterval: options.refetchInterval ?? 60_000,
    staleTime: options.staleTime ?? 30_000,
  });

  return Object.assign(query, {
    flagEnabled: gate.flagEnabled,
    permissionGranted: gate.permissionGranted,
    dryRunFallback: gate.dryRunFallback,
  });
}

export function useEquitiesSignals(
  tickers: readonly string[],
  options: EquitiesSignalsOptions = {}
): UseQueryResult<EquitiesSignalsResponse> & EquitiesQueryState {
  const normalizedTickers = useMemo(() => normalizeTickers(tickers), [tickers]);
  const macroRegime = options.macroRegime ?? "neutral";
  const gate = useEquitiesGate(options.enabled !== false && normalizedTickers.length > 0);

  const query = useQuery<EquitiesSignalsResponse>({
    queryKey: ["equities", "signals", normalizedTickers, macroRegime],
    queryFn: async () => {
      const params = new URLSearchParams({
        tickers: normalizedTickers.join(","),
        macroRegime,
      });
      const { data, dryRun } = await fetchEquitiesEndpoint<EquitiesSignalsResponse>(
        `/api/equities/signals?${params.toString()}`
      );
      return { ...data, dryRun: data.dryRun ?? dryRun };
    },
    enabled: gate.gateEnabled,
    refetchInterval: options.refetchInterval ?? 60_000,
    staleTime: options.staleTime ?? 30_000,
  });

  return Object.assign(query, {
    flagEnabled: gate.flagEnabled,
    permissionGranted: gate.permissionGranted,
    dryRunFallback: gate.dryRunFallback,
  });
}

export interface UseEquitiesRecommendationsVariables {
  tickers: readonly string[];
  macroRegime?: "risk-on" | "risk-off" | "neutral";
  configuration?: {
    id?: string;
    name?: string;
    mandate?: string;
  };
}

export function useEquitiesRecommendations(
  variables: UseEquitiesRecommendationsVariables,
  options: EquitiesRecommendationsOptions = {}
): UseQueryResult<EquitiesRecommendationsResponse> & EquitiesQueryState {
  const normalizedTickers = useMemo(() => normalizeTickers(variables?.tickers ?? []), [variables?.tickers]);
  const macroRegime = variables?.macroRegime ?? options.macroRegime ?? "neutral";
  const gate = useEquitiesGate(options.enabled !== false && normalizedTickers.length > 0);

  const query = useQuery<EquitiesRecommendationsResponse>({
    queryKey: ["equities", "recommendations", normalizedTickers, macroRegime, variables?.configuration?.id],
    queryFn: async () => {
      const payload = {
        tickers: normalizedTickers,
        macroRegime,
        configuration: variables?.configuration,
      };

      const { data, dryRun } = await fetchEquitiesEndpoint<EquitiesRecommendationsResponse>(
        `/api/equities/recommendations`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      return { ...data, dryRun: data.dryRun ?? dryRun };
    },
    enabled: gate.gateEnabled,
    refetchInterval: options.refetchInterval ?? 120_000,
    staleTime: options.staleTime ?? 60_000,
  });

  return Object.assign(query, {
    flagEnabled: gate.flagEnabled,
    permissionGranted: gate.permissionGranted,
    dryRunFallback: gate.dryRunFallback,
  });
}

export interface UseEquitiesBacktestMutationOptions
  extends UseMutationOptions<EquitiesBacktestResponse, EquitiesApiError, EquitiesBacktestRequest> {}

export function useEquitiesBacktest(
  options?: UseEquitiesBacktestMutationOptions
): UseMutationResult<EquitiesBacktestResponse, EquitiesApiError, EquitiesBacktestRequest> & EquitiesQueryState {
  const gate = useEquitiesGate(true);

  const mutation = useMutation<EquitiesBacktestResponse, EquitiesApiError, EquitiesBacktestRequest>({
    mutationFn: async (body) => {
      const { data, dryRun } = await fetchEquitiesEndpoint<EquitiesBacktestResponse>(
        `/api/equities/backtest`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      return { ...data, dryRun: data.dryRun ?? dryRun };
    },
    ...options,
  });

  return Object.assign(mutation, {
    flagEnabled: gate.flagEnabled,
    permissionGranted: gate.permissionGranted,
    dryRunFallback: gate.dryRunFallback,
  });
}
