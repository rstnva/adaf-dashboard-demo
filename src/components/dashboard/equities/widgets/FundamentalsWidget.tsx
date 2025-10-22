"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { equitiesI18n } from "../i18n";
import type { EquityFundamentalSnapshot, EquityPriceSnapshot } from "@/lib/equities";

interface FundamentalsWidgetProps {
  fundamentals: Record<string, EquityFundamentalSnapshot>;
  prices: Record<string, EquityPriceSnapshot>;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function FundamentalsWidget({ fundamentals, prices }: FundamentalsWidgetProps) {
  const entries = Object.values(fundamentals).slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{equitiesI18n["equities.widgets.fundamentals.title"]}</CardTitle>
        <CardDescription>{equitiesI18n["equities.widgets.fundamentals.subtitle"]}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{equitiesI18n["equities.table.ticker"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.pe"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.fwdPe"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.peg"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.dividend"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.revenue"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.eps"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.fcf"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.volume"]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((snapshot) => {
              const price = prices[snapshot.ticker];
              return (
                <TableRow key={snapshot.ticker} className="border-amber-300/10">
                  <TableCell className="text-amber-100/90">{snapshot.ticker}</TableCell>
                  <TableCell>{snapshot.peRatio?.toFixed?.(2) ?? "—"}</TableCell>
                  <TableCell>{snapshot.forwardPeRatio?.toFixed?.(2) ?? "—"}</TableCell>
                  <TableCell>{snapshot.pegRatio?.toFixed?.(2) ?? "—"}</TableCell>
                  <TableCell>{formatPercent(snapshot.dividendYield)}</TableCell>
                  <TableCell>{formatPercent(snapshot.revenueGrowthYoY)}</TableCell>
                  <TableCell>{formatPercent(snapshot.epsGrowthYoY)}</TableCell>
                  <TableCell>{formatPercent(snapshot.freeCashFlowMargin)}</TableCell>
                  <TableCell>{price?.volume ? price.volume.toLocaleString("es-MX") : "—"}</TableCell>
                </TableRow>
              );
            })}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-6 text-center text-sm text-amber-100/70">
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
