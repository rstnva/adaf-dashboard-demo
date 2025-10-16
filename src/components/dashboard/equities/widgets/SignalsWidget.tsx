"use client";

import { useState } from "react";
import { Flame, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { equitiesI18n } from "../i18n";
import type { EquitySignal } from "@/lib/equities";

interface SignalsWidgetProps {
  signals: EquitySignal[];
  macroRegime: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function SignalsWidget({ signals, macroRegime, onRefresh, refreshing }: SignalsWidgetProps) {
  const [selected, setSelected] = useState<EquitySignal | null>(null);

  const convictionColor = (conviction: EquitySignal["conviction"]) => {
    switch (conviction) {
      case "high":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-400/40";
      case "medium":
        return "bg-amber-500/20 text-amber-200 border-amber-400/40";
      default:
        return "bg-slate-500/20 text-slate-200 border-slate-400/40";
    }
  };

  const macroLabel =
    macroRegime === "risk-on"
      ? equitiesI18n["equities.macro.riskOn"]
      : macroRegime === "risk-off"
      ? equitiesI18n["equities.macro.riskOff"]
      : equitiesI18n["equities.macro.neutral"];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{equitiesI18n["equities.widgets.signals.title"]}</CardTitle>
            <CardDescription>
              {equitiesI18n["equities.widgets.signals.subtitle"]} · {macroLabel}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-xs text-amber-100/70 hover:text-amber-50"
          >
            <Zap className="mr-2 h-4 w-4" />
            {equitiesI18n["equities.actions.refreshSignals"]}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{equitiesI18n["equities.table.ticker"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.score"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.conviction"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.signal"]}</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.slice(0, 10).map((signal) => (
              <TableRow key={signal.id} className="border-amber-300/10">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-900/60 text-amber-100">
                      {signal.ticker}
                    </Badge>
                    <span className="text-xs text-amber-100/60">{signal.horizonDays}d</span>
                  </div>
                </TableCell>
                <TableCell className="text-amber-100/80">{signal.compositeScore.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`uppercase tracking-[0.2em] ${convictionColor(signal.conviction)}`}
                  >
                    {signal.conviction}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-amber-100/70">{signal.rationale}</TableCell>
                <TableCell className="text-right">
                  <Dialog onOpenChange={(open) => !open && setSelected(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(signal)}
                        className="text-xs text-amber-100/70 hover:text-amber-50"
                      >
                        {equitiesI18n["equities.actions.viewDetails"]}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg bg-zinc-950/95 text-amber-100">
                      <DialogHeader>
                        <DialogTitle>
                          {equitiesI18n["equities.modal.signal.title"]}: {selected?.ticker}
                        </DialogTitle>
                        <DialogDescription>
                          {equitiesI18n["equities.table.score"]}: {selected?.compositeScore.toFixed(2)} ·
                          {" "}
                          {equitiesI18n["equities.table.conviction"]}: {selected?.conviction}
                        </DialogDescription>
                      </DialogHeader>
                      {selected && (
                        <div className="space-y-4 text-sm text-amber-100/80">
                          <div className="rounded-2xl border border-amber-300/10 bg-amber-50/5 p-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-100/60">
                              <Flame className="h-4 w-4" /> {equitiesI18n["equities.modal.signal.dimensions"]}
                            </div>
                            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(selected.dimensions).map(([dimension, value]) => (
                                <div
                                  key={dimension}
                                  className="flex items-center justify-between rounded-xl border border-amber-300/10 bg-amber-100/5 px-3 py-2"
                                >
                                  <dt className="capitalize text-amber-100/70">{dimension.replace(/Score$/, "")}</dt>
                                  <dd className="text-amber-100/90">{value?.toFixed?.(2) ?? "0.00"}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                          {selected.tags?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {selected.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                          <div className="rounded-xl border border-amber-300/10 bg-amber-100/5 p-3 text-xs">
                            {selected.rationale}
                          </div>
                          <div className="text-xs text-amber-100/60">
                            Modelo: {selected.modelVersion} · Generado: {new Date(selected.generatedAt).toLocaleString("es-MX")}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {signals.length === 0 && (
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
