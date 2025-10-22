"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, BarChart4, LineChart, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { SkeletonPatterns } from "@/components/common/SkeletonBlock";
import { EquitiesSleeveGrid } from "@/components/dashboard/equities/EquitiesSleeveGrid";
import { SleeveOverviewWidget } from "@/components/dashboard/equities/widgets/SleeveOverviewWidget";
import { RecommendationActionsWidget } from "@/components/dashboard/equities/widgets/RecommendationActionsWidget";
import { SignalsWidget } from "@/components/dashboard/equities/widgets/SignalsWidget";
import { FundamentalsWidget } from "@/components/dashboard/equities/widgets/FundamentalsWidget";
import { EtfFlowsWidget } from "@/components/dashboard/equities/widgets/EtfFlowsWidget";
import { OwnershipWidget } from "@/components/dashboard/equities/widgets/OwnershipWidget";
import { BacktestWidget } from "@/components/dashboard/equities/widgets/BacktestWidget";
import {
  useEquitiesBacktest,
  useEquitiesRecommendations,
  useEquitiesSignals,
} from "@/lib/api/useEquitiesSleeve";
import type { EquitiesBacktestRequest } from "@/lib/equities";
import { equitiesI18n } from "@/components/dashboard/equities/i18n";
import { trackUiEvent } from "@/lib/utils/telemetry";

const DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META"] as const;

const macroOptions: Array<{ value: "risk-on" | "risk-off" | "neutral"; label: string }> = [
  { value: "risk-on", label: equitiesI18n["equities.macro.riskOn"] },
  { value: "neutral", label: equitiesI18n["equities.macro.neutral"] },
  { value: "risk-off", label: equitiesI18n["equities.macro.riskOff"] },
];

export default function EquitiesSleevePage() {
  const [macroRegime, setMacroRegime] = useState<"risk-on" | "risk-off" | "neutral">("neutral");

  const recommendationsQuery = useEquitiesRecommendations({
    tickers: DEFAULT_TICKERS,
    macroRegime,
    configuration: {
      id: "equities-ai-core",
      name: "Sleeve Core Equities AI",
      mandate: "Core equities sleeve",
    },
  });

  const gateEnabled = recommendationsQuery.flagEnabled && recommendationsQuery.permissionGranted;

  const signalsQuery = useEquitiesSignals(DEFAULT_TICKERS, {
    macroRegime,
    enabled: gateEnabled,
    refetchInterval: 120_000,
  });

  const { mutate: triggerBacktest, data: backtestData, isPending: backtestPending } = useEquitiesBacktest();

  const data = recommendationsQuery.data ?? null;
  const isLoading = recommendationsQuery.isLoading || (!data && signalsQuery.isLoading);
  const hasError = recommendationsQuery.error ?? signalsQuery.error;

  const defaultBacktestRequest = useMemo<EquitiesBacktestRequest | null>(() => {
    if (!data) {
      return null;
    }
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      sleeveId: data.sleeveState.sleeveId,
      startDate: start.toISOString(),
      endDate: new Date().toISOString(),
      benchmark: "SPY",
      initialCapital: 5_000_000,
      transactionCostBps: 5,
      slippageBps: 10,
      includeDrawdown: true,
    };
  }, [data]);

  const dryRunActive = data?.dryRun ?? recommendationsQuery.dryRunFallback;

  const backtestResult = backtestData?.result ?? null;
  const runBacktest = useCallback(() => {
    if (!defaultBacktestRequest) {
      return;
    }
    trackUiEvent.equitiesRunBacktest({
      sleeveId: defaultBacktestRequest.sleeveId,
      macro: macroRegime,
      dryRun: dryRunActive,
      tickers: Array.from(DEFAULT_TICKERS),
    });
    triggerBacktest(defaultBacktestRequest);
  }, [defaultBacktestRequest, dryRunActive, macroRegime, triggerBacktest]);

  const { refetch: refetchSignals, isFetching: signalsRefreshing, data: signalsRaw } = signalsQuery;
  const refreshSignals = useCallback(() => {
    trackUiEvent.equitiesRefreshSignals(macroRegime);
    void refetchSignals();
  }, [macroRegime, refetchSignals]);

  const signalsData = useMemo(() => {
    return signalsRaw?.signals ?? data?.signals ?? [];
  }, [signalsRaw, data]);

  const widgets = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      {
        key: "overview",
        component: (
          <SleeveOverviewWidget
            sleeve={data.sleeveState}
            recommendation={data.recommendation}
          />
        ),
      },
      {
        key: "actions",
        component: <RecommendationActionsWidget recommendation={data.recommendation} />,
      },
      {
        key: "signals",
        component: (
          <SignalsWidget
            signals={signalsData}
            macroRegime={macroRegime}
            onRefresh={refreshSignals}
            refreshing={signalsRefreshing}
          />
        ),
      },
      {
        key: "fundamentals",
        component: (
          <FundamentalsWidget
            fundamentals={data.fundamentals}
            prices={data.prices}
          />
        ),
      },
      {
        key: "etfFlows",
        component: <EtfFlowsWidget flows={data.etfFlows} />,
      },
      {
        key: "ownership",
        component: <OwnershipWidget ownership={data.ownership} />,
      },
      {
        key: "backtest",
        component: (
          <BacktestWidget
            result={backtestResult}
            onLaunchBacktest={runBacktest}
          />
        ),
      },
    ];
  }, [
    data,
    signalsData,
    macroRegime,
    refreshSignals,
    signalsRefreshing,
    backtestResult,
    runBacktest,
  ]);

  if (!recommendationsQuery.flagEnabled) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-amber-200">
            <Sparkles className="h-4 w-4" />
            Equities AI Sleeve
          </div>
          <h1 className="text-3xl font-semibold text-foreground">{equitiesI18n["equities.title"]}</h1>
        </header>
        <Alert className="border-amber-400/40 bg-amber-500/10 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{equitiesI18n["equities.flag.off"]}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!recommendationsQuery.permissionGranted) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-amber-200">
            <Sparkles className="h-4 w-4" />
            Equities AI Sleeve
          </div>
          <h1 className="text-3xl font-semibold text-foreground">{equitiesI18n["equities.title"]}</h1>
        </header>
        <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{equitiesI18n["equities.permission.denied"]}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (hasError) {
    return (
      <ErrorState
        error={hasError as Error}
        onRetry={() => {
          recommendationsQuery.refetch();
          signalsQuery.refetch();
        }}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-amber-200">
            <Sparkles className="h-4 w-4" /> Equities AI Sleeve
          </div>
          <SkeletonPatterns.CardTitle />
          <SkeletonPatterns.MetricValue />
        </header>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-amber-300/10 bg-amber-50/5 p-6">
              <SkeletonPatterns.Table rows={3} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-amber-200">
              <Sparkles className="h-4 w-4" /> Equities AI Sleeve
            </div>
            <h1 className="text-3xl font-semibold text-foreground">{equitiesI18n["equities.title"]}</h1>
            <p className="text-sm text-amber-100/80 max-w-2xl">
              {equitiesI18n["equities.subtitle"]}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-400/40 text-emerald-200">
                <LineChart className="mr-2 h-3 w-3" /> {DEFAULT_TICKERS.length} tickers
              </Badge>
              <Badge variant="outline" className="border-amber-400/40 text-amber-200">
                <BarChart4 className="mr-2 h-3 w-3" /> Macro: {macroOptions.find((option) => option.value === macroRegime)?.label}
              </Badge>
              <Badge
                variant="outline"
                className={dryRunActive ? "border-amber-400/40 text-amber-200" : "border-emerald-400/40 text-emerald-200"}
              >
                {dryRunActive ? equitiesI18n["equities.badge.dryRun"] : equitiesI18n["equities.badge.live"]}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-amber-100/60">Macro regime</div>
            <div className="flex gap-2">
              {macroOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={option.value === macroRegime ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMacroRegime(option.value);
                    trackUiEvent.equitiesMacroChange(option.value);
                  }}
                  className={option.value === macroRegime ? "bg-amber-500 text-black" : "border-amber-400/40 text-amber-100/80"}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {backtestPending && (
              <span className="text-xs text-amber-100/60">{equitiesI18n["equities.actions.backtest"]}…</span>
            )}
          </div>
        </div>

        {dryRunActive && (
          <Alert className="border-amber-400/40 bg-amber-500/10 text-amber-100">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              {equitiesI18n["equities.overview.dryRun"]}
            </AlertDescription>
          </Alert>
        )}
      </header>

      <EquitiesSleeveGrid widgets={widgets} />
    </div>
  );
}
