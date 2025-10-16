"use client";

import { useQuery } from "@tanstack/react-query";

import type { DefiOpportunity } from "@/lib/defi/types";

export interface DefiOpportunitiesFilters {
  search?: string;
  chains?: string[];
  protocols?: string[];
  minApy?: number;
  stablecoinOnly?: boolean;
}

export interface DefiOpportunitiesResult {
  updatedAt: number;
  opportunities: DefiOpportunity[];
  meta: {
    total: number;
  };
}

const serializeFilters = (filters: DefiOpportunitiesFilters | undefined) => {
  if (!filters) return "";
  return JSON.stringify({
    ...filters,
    chains: filters.chains?.slice().sort(),
    protocols: filters.protocols?.slice().sort(),
  });
};

const buildQueryString = (filters: DefiOpportunitiesFilters | undefined) => {
  const params = new URLSearchParams();

  if (!filters) return params;

  if (filters.search) params.set("search", filters.search.trim());
  if (filters.chains && filters.chains.length > 0) params.set("chains", filters.chains.join(","));
  if (filters.protocols && filters.protocols.length > 0) params.set("protocols", filters.protocols.join(","));
  if (typeof filters.minApy === "number") params.set("minApy", String(filters.minApy));
  if (filters.stablecoinOnly) params.set("stablecoinOnly", "true");

  return params;
};

export function useDefiOpportunities(filters?: DefiOpportunitiesFilters) {
  return useQuery<DefiOpportunitiesResult>({
    queryKey: ["defi", "opportunities", serializeFilters(filters)],
    queryFn: async () => {
      const params = buildQueryString(filters);
      const response = await fetch(`/api/defi/opportunities?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load DeFi opportunities (${response.status})`);
      }

      return (await response.json()) as DefiOpportunitiesResult;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
