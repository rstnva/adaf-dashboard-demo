"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, Activity, CircleDot } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { equitiesI18n } from "../i18n";
import type { EquityRecommendationPackage, EquitySleeveState } from "@/lib/equities";

interface SleeveOverviewWidgetProps {
  sleeve: EquitySleeveState | undefined;
  recommendation: EquityRecommendationPackage | undefined;
}

function formatBps(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("es-MX")} bps`;
}

export function SleeveOverviewWidget({ sleeve, recommendation }: SleeveOverviewWidgetProps) {
  if (!sleeve) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{equitiesI18n["equities.title"]}</CardTitle>
          <CardDescription>{equitiesI18n["equities.subtitle"]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-sm text-amber-50/70">
            {equitiesI18n["equities.status.noData"]}
          </div>
        </CardContent>
      </Card>
    );
  }

  const risk = sleeve.riskBudget;
  const updatedAt = format(new Date(sleeve.updatedAt), "PPpp", { locale: es });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{sleeve.displayName}</CardTitle>
            <CardDescription>{sleeve.description}</CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-400/60 text-amber-200">
            {sleeve.dryRun ? equitiesI18n["equities.badge.dryRun"] : equitiesI18n["equities.badge.live"]}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-amber-200/70">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 px-3 py-1">
            <ShieldCheck className="h-4 w-4" />
            {equitiesI18n["equities.overview.rebalance"]}: {sleeve.compliance.rebalanceWindow === "open"
              ? equitiesI18n["equities.badge.open"]
              : sleeve.compliance.rebalanceWindow === "closed"
              ? equitiesI18n["equities.badge.closed"]
              : equitiesI18n["equities.badge.pending"]}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 px-3 py-1">
            <Activity className="h-4 w-4" />
            {equitiesI18n["equities.overview.lastUpdated"]}: {updatedAt}
          </div>
          {sleeve.compliance.requiresWetSignature && (
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-1 text-rose-300">
              <CircleDot className="h-4 w-4" />
              {equitiesI18n["equities.badge.requiresSignature"]}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-300/10 bg-amber-50/5 p-4">
            <div className="text-xs uppercase tracking-wide text-amber-100/60">
              {equitiesI18n["equities.overview.baseCurrency"]}
            </div>
            <div className="text-2xl font-semibold text-amber-100">{sleeve.baseCurrency}</div>
            <p className="mt-2 text-xs text-amber-100/60">
              {equitiesI18n["equities.overview.dryRun"]}: {sleeve.dryRun ? "Sí" : "No"}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/10 bg-amber-50/5 p-4">
            <div className="text-xs uppercase tracking-wide text-amber-100/60">
              {equitiesI18n["equities.overview.risk"]}
            </div>
            <dl className="mt-2 space-y-1 text-sm text-amber-100/80">
              <div className="flex items-center justify-between">
                <dt>{equitiesI18n["equities.overview.exposure"]}</dt>
                <dd>{formatBps(risk.maxGrossExposure)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{equitiesI18n["equities.overview.netExposure"]}</dt>
                <dd>{formatBps(risk.maxNetExposure)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{equitiesI18n["equities.overview.volTarget"]}</dt>
                <dd>{(risk.volatilityTarget * 100).toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
        </div>

        {recommendation && (
          <div className="rounded-2xl border border-amber-300/10 bg-amber-50/5 p-4">
            <div className="text-xs uppercase tracking-wide text-amber-100/60">
              {equitiesI18n["equities.kpi.actions"]}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommendation.actions.slice(0, 6).map((action) => (
                <Badge key={action.ticker} variant="secondary" className="border border-amber-300/30 bg-amber-200/10">
                  {action.ticker} · {action.action.toUpperCase()} · {action.targetWeightBps}bps
                </Badge>
              ))}
              {recommendation.actions.length === 0 && (
                <span className="text-xs text-amber-100/60">{equitiesI18n["equities.status.noData"]}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
