"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { equitiesI18n } from "../i18n";
import type { EquityRecommendationAction, EquityRecommendationPackage } from "@/lib/equities";

interface RecommendationActionsWidgetProps {
  recommendation: EquityRecommendationPackage | undefined;
}

export function RecommendationActionsWidget({ recommendation }: RecommendationActionsWidgetProps) {
  const [selected, setSelected] = useState<EquityRecommendationAction | null>(null);

  const actions = useMemo(() => recommendation?.actions ?? [], [recommendation?.actions]);

  const totals = useMemo(() => {
    return actions.reduce(
      (acc, action) => {
        acc.weight += action.targetWeightBps ?? 0;
        acc.alpha += action.expectedAlphaBps ?? 0;
        return acc;
      },
      { weight: 0, alpha: 0 }
    );
  }, [actions]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{equitiesI18n["equities.widgets.actions.title"]}</CardTitle>
            <CardDescription>{equitiesI18n["equities.widgets.actions.subtitle"]}</CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-400/40 text-emerald-200">
            <TrendingUp className="mr-2 h-3 w-3" />
            {actions.length} {equitiesI18n["equities.kpi.actions"]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-amber-300/15 bg-amber-100/5 p-4 text-sm text-amber-100/80">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
            <Target className="h-4 w-4" /> {equitiesI18n["equities.widgets.actions.total"]}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <span>{equitiesI18n["equities.widgets.actions.totalWeight"]}: {totals.weight.toLocaleString("es-MX")} bps</span>
            <span>{equitiesI18n["equities.widgets.actions.totalAlpha"]}: {totals.alpha.toLocaleString("es-MX")} bps</span>
            <span>{equitiesI18n["equities.widgets.actions.totalDryRun"]}: {recommendation?.dryRun ? "Sí" : "No"}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{equitiesI18n["equities.table.ticker"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.action"]}</TableHead>
              <TableHead className="text-right">{equitiesI18n["equities.table.weight"]}</TableHead>
              <TableHead className="text-right">{equitiesI18n["equities.table.alpha"]}</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.slice(0, 8).map((action) => (
              <TableRow key={action.ticker} className="border-amber-300/10">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-900/60 text-amber-100">
                      {action.ticker}
                    </Badge>
                    <span className="text-amber-100/80">{action.notes ?? ""}</span>
                  </div>
                </TableCell>
                <TableCell className="uppercase tracking-[0.2em] text-amber-100/90">{action.action}</TableCell>
                <TableCell className="text-right text-amber-100/80">
                  {action.targetWeightBps?.toLocaleString("es-MX")}
                </TableCell>
                <TableCell className="text-right text-emerald-300">
                  {action.expectedAlphaBps?.toLocaleString("es-MX") ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog onOpenChange={(open) => !open && setSelected(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(action)}
                        className="text-xs text-amber-100/70 hover:text-amber-50"
                      >
                        {equitiesI18n["equities.actions.viewDetails"]}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-zinc-950/95 text-amber-100">
                      <DialogHeader>
                        <DialogTitle>
                          {equitiesI18n["equities.modal.signal.title"]}: {selected?.ticker}
                        </DialogTitle>
                        <DialogDescription>
                          Acción: {selected?.action?.toUpperCase()} · Peso: {selected?.targetWeightBps} bps
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong>Alpha esperado:</strong> {selected?.expectedAlphaBps ?? "—"} bps
                        </div>
                        <div>
                          <strong>Stop Loss:</strong> {selected?.stopLossBps ?? "—"} bps
                        </div>
                        <div>
                          <strong>Take Profit:</strong> {selected?.takeProfitBps ?? "—"} bps
                        </div>
                        {selected?.notes && (
                          <div className="rounded-xl border border-amber-300/10 bg-amber-50/5 p-3 text-xs text-amber-100/80">
                            {selected.notes}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-amber-100/70">
                  {equitiesI18n["equities.status.noData"]}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
