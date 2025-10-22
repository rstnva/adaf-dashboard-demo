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
import type { EquityEtfFlowSnapshot } from "@/lib/equities";

interface EtfFlowsWidgetProps {
  flows: EquityEtfFlowSnapshot[];
}

export function EtfFlowsWidget({ flows }: EtfFlowsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{equitiesI18n["equities.widgets.etfFlows.title"]}</CardTitle>
        <CardDescription>{equitiesI18n["equities.widgets.etfFlows.subtitle"]}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{equitiesI18n["equities.table.ticker"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.flow"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.aum"]}</TableHead>
              <TableHead>{equitiesI18n["equities.table.volume"]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.slice(0, 10).map((flow) => (
              <TableRow key={`${flow.vehicle}-${flow.ticker}`} className="border-amber-300/10">
                <TableCell className="text-amber-100/90">{flow.vehicle}</TableCell>
                <TableCell className="text-emerald-300">
                  {flow.netFlowUsd?.toLocaleString("es-MX", { style: "currency", currency: "USD" }) ?? "—"}
                </TableCell>
                <TableCell>
                  {flow.aumUsd?.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 2 }) ?? "—"}
                </TableCell>
                <TableCell>
                  {flow.flow5DUsd?.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 2 }) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {flows.length === 0 && (
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
