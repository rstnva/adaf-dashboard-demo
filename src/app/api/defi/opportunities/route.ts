import { NextResponse } from "next/server";

import { getDefiOpportunities } from "@/lib/defi/opportunities";
import type { DefiOpportunity } from "@/lib/defi/types";

const parseListParam = (value: string | null): string[] | undefined => {
  if (!value) return undefined;
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const matchesSearch = (opportunity: DefiOpportunity, query: string | null) => {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return (
    opportunity.protocol.toLowerCase().includes(normalized) ||
    opportunity.chain.toLowerCase().includes(normalized) ||
    opportunity.symbol.toLowerCase().includes(normalized) ||
    (opportunity.details ?? "").toLowerCase().includes(normalized)
  );
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chains = parseListParam(url.searchParams.get("chains"));
  const protocols = parseListParam(url.searchParams.get("protocols"));
  const stablecoinOnly = url.searchParams.get("stablecoinOnly") === "true";
  const minApyParam = url.searchParams.get("minApy");
  const maxResultsParam = url.searchParams.get("limit");
  const searchQuery = url.searchParams.get("search");

  const minApy = minApyParam ? Number(minApyParam) : undefined;
  const maxResults = maxResultsParam ? Number(maxResultsParam) : undefined;

  try {
    const response = await getDefiOpportunities({
      chains,
      protocols,
      stablecoinOnly,
      minApy,
      maxResults,
    });

    const payload = {
      updatedAt: response.updatedAt,
      opportunities: response.opportunities.filter((item) => matchesSearch(item, searchQuery)),
      meta: {
        total: response.opportunities.length,
        filters: {
          chains,
          protocols,
          stablecoinOnly,
          minApy,
          maxResults,
          search: searchQuery ?? undefined,
        },
      },
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[defi.opportunities]", error);
    return NextResponse.json(
      {
        error: "Unable to load DeFi opportunities",
        meta: {
          reason: error instanceof Error ? error.message : "unknown",
        },
      },
      { status: 502 }
    );
  }
}
