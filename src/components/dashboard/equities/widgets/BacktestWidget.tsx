"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { equitiesI18n } from "../i18n";
import type { EquitiesBacktestResult } from "@/lib/equities";

interface BacktestWidgetProps {
  result: EquitiesBacktestResult | null;
  onLaunchBacktest?: () => void;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const curvePoints = 48;

export function BacktestWidget({ result, onLaunchBacktest }: BacktestWidgetProps) {
  const sparklinePath = useMemo(() => {
    if (!result || result.equityCurve.length === 0) {
      return "";
    }

    const sample = result.equityCurve.slice(-curvePoints);
    const values = sample.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return sample
      .map((point, index) => {
        const x = (index / (sample.length - 1 || 1)) * 100;
        const y = 100 - ((point.value - min) / range) * 100;
        return `${index === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [result]);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle>{equitiesI18n["equities.widgets.backtest.title"]}</CardTitle>
        <CardDescription>{equitiesI18n["equities.widgets.backtest.subtitle"]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-amber-100/70">{equitiesI18n["equities.stats.cagr"]}</p>
              <p className="text-lg font-semibold text-emerald-300">
                {formatPercent(result?.cagr ?? null)}
              </p>
            </div>
            <div>
              <p className="text-amber-100/70">{equitiesI18n["equities.stats.sharpe"]}</p>
              <p className="text-lg font-semibold">{result?.sharpe?.toFixed(2) ?? "—"}</p>
            </div>
            <div>
              <p className="text-amber-100/70">{equitiesI18n["equities.stats.drawdown"]}</p>
              <p className="text-lg font-semibold text-rose-300">
                {formatPercent(result?.maxDrawdown ?? null)}
              </p>
            </div>
            <div>
              <p className="text-amber-100/70">{equitiesI18n["equities.stats.turnover"]}</p>
              <p className="text-lg font-semibold">{formatPercent(result?.turnover ?? null)}</p>
            </div>
          </div>
          <div className="relative h-24 w-40 rounded-sm bg-amber-500/5 p-2">
            {sparklinePath ? (
              <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-300">
                <path
                  d={`${sparklinePath} L100,100 L0,100 Z`}
                  fill="currentColor"
                  className="opacity-20"
                />
                <path d={sparklinePath} stroke="currentColor" strokeWidth={1.6} fill="none" />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-amber-100/60">
                {equitiesI18n["equities.status.noData"]}
              </div>
            )}
          </div>
        </div>
        {result?.notes && (
          <Badge variant="secondary" className="bg-amber-400/10 text-amber-200">
            {result.notes}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t border-amber-400/10 pt-4">
        <Button variant="ghost" size="sm" onClick={onLaunchBacktest} disabled={!onLaunchBacktest}>
          {equitiesI18n["equities.cta.fullBacktest"]}
        </Button>
      </CardFooter>
    </Card>
  );
}
