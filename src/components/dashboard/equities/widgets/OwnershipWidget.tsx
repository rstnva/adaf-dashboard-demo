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
import type { EquityInstitutionalOwnership } from "@/lib/equities";

interface OwnershipWidgetProps {
  ownership: EquityInstitutionalOwnership[];
}

export function OwnershipWidget({ ownership }: OwnershipWidgetProps) {
  const convictionLabel = (value: EquityInstitutionalOwnership["conviction"]) => {
    const key = `equities.owner.${value}` as const;
    return equitiesI18n[key] ?? value;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{equitiesI18n["equities.widgets.ownership.title"]}</CardTitle>
        <CardDescription>{equitiesI18n["equities.widgets.ownership.subtitle"]}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{equitiesI18n["equities.table.firm"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.weightPct"]}</TableHead>
              <TableHead>{equitiesI18n["equities.owner.position"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.date"]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownership.slice(0, 10).map((position) => (
              <TableRow key={`${position.ticker}-${position.reportedAt}-${position.filer}`} className="border-amber-300/10">
                <TableCell className="text-amber-100/90">{position.filer}</TableCell>
                <TableCell>
                  {position.weightBps !== null && position.weightBps !== undefined
                    ? (position.weightBps / 10_000).toLocaleString("es-MX", {
                        style: "percent",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </TableCell>
                <TableCell
                  className={
                    position.conviction === "increasing"
                      ? "text-emerald-300"
                      : position.conviction === "decreasing"
                      ? "text-rose-300"
                      : "text-amber-100/80"
                  }
                >
                  {position.positionUsd?.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }) ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs text-amber-100/80">
                    <span>{position.reportedAt}</span>
                    <span className="text-amber-100/60">{convictionLabel(position.conviction)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {ownership.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-amber-100/70">
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
