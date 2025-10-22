'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Loader2,
  Minus,
  OctagonAlert,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useOracleDQSummary,
  type DqFeedSummary,
  type DqRuleSummary,
  type DqShadowRmse,
} from '@/hooks';

const percentageFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('es-MX');

function getSeverityConfig(status: string) {
  switch (status) {
    case 'critical':
      return {
        label: 'Crítico',
        icon: <OctagonAlert className="h-5 w-5 text-red-600" />,
        badgeClass: 'adaf-badge-severity-red',
        textClass: 'text-red-700',
      } as const;
    case 'warning':
      return {
        label: 'Advertencia',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        badgeClass: 'adaf-badge-severity-amber',
        textClass: 'text-amber-700',
      } as const;
    default:
      return {
        label: 'Saludable',
        icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
        badgeClass: 'adaf-badge-severity-ok',
        textClass: 'text-emerald-700',
      } as const;
  }
}

function getTrendConfig(status: string) {
  switch (status) {
    case 'deteriorating':
      return {
        label: 'Deteriorando',
        icon: <ArrowUpRight className="h-4 w-4 text-red-600" />,
        chipClass: 'border-red-200 bg-red-50 text-red-700',
      } as const;
    case 'improving':
      return {
        label: 'Mejorando',
        icon: <ArrowDownRight className="h-4 w-4 text-emerald-600" />,
        chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      } as const;
    default:
      return {
        label: 'Estable',
        icon: <Minus className="h-4 w-4 text-slate-500" />,
        chipClass: 'border-slate-200 bg-slate-50 text-slate-600',
      } as const;
  }
}

function formatFailureRatio(ratio: number, opts: { allowNegative?: boolean } = {}) {
  const { allowNegative = false } = opts;
  if (!Number.isFinite(ratio)) {
    return '—';
  }
  const value = allowNegative ? ratio : Math.max(ratio, 0);
  return percentageFormatter.format(value);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return numberFormatter.format(value);
}

function renderShadowMetric(shadow?: DqShadowRmse) {
  if (!shadow) return null;
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
      <div className="flex items-center gap-2 font-semibold">
        <BarChart2 className="h-4 w-4" /> RMSE shadow
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-base font-semibold">{formatNumber(shadow.rmse)}</span>
        <span className="text-[11px] uppercase tracking-wide text-indigo-600/80">
          baseline {formatNumber(shadow.baseline)}
        </span>
        <span className="text-[11px] text-slate-500">muestras {shadow.samples}</span>
      </div>
      <div className="text-[11px] text-slate-500">Actualizado {shadow.lastUpdated}</div>
    </div>
  );
}

function pickTopRule(rules: DqRuleSummary[]): DqRuleSummary | undefined {
  if (!Array.isArray(rules) || rules.length === 0) return undefined;
  return [...rules].sort((a, b) => b.failureRatio - a.failureRatio || b.fail - a.fail)[0];
}

export function OracleDataQualityCard() {
  const { summary, isLoading, error, refetch } = useOracleDQSummary();

  const feedHighlights = useMemo(() => {
    if (!summary?.feeds) return [] as DqFeedSummary[];
    return summary.feeds.slice(0, 4);
  }, [summary]);

  const lastUpdated = summary?.generatedAt
    ? formatDistanceToNow(new Date(summary.generatedAt), { addSuffix: true })
    : null;

  const totalSeverity = summary ? getSeverityConfig(summary.totals.severity.status) : null;
  const totalTrend = summary ? getTrendConfig(summary.totals.trend.status) : null;
  const totalShadow = summary?.totals.shadowRmse;

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <Card className="adaf-card">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Calidad de Datos del Oráculo
          </CardTitle>
          {totalSeverity && (
            <Badge className={totalSeverity.badgeClass}>{totalSeverity.label}</Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando telemetría del oráculo…
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <OctagonAlert className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {!isLoading && !error && summary && (
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-slate-500">Estado general</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {totalSeverity?.icon}
                    <span className={`text-xl font-semibold ${totalSeverity?.textClass ?? ''}`}>
                      {totalSeverity?.label}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Ratio fallas {formatFailureRatio(summary.totals.failureRatio)}
                    </Badge>
                    {totalShadow && totalShadow.rmse > 0 && (
                      <Badge variant="secondary" className="text-xs text-indigo-700">
                        Shadow RMSE {formatNumber(totalShadow.rmse)} · {totalShadow.feeds ?? 0} feeds
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 max-w-2xl">
                    {summary.totals.severity.recommendation}
                  </p>
                </div>
                {totalTrend && (
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${totalTrend.chipClass}`}>
                    {totalTrend.icon}
                    <span className="font-medium">{totalTrend.label}</span>
                    <span className="text-xs">
                      Δ fallas {numberFormatter.format(summary.totals.trend.delta.fail)} · Δ ratio{' '}
                      {formatFailureRatio(summary.totals.trend.delta.failureRatio, { allowNegative: true })}
                    </span>
                  </div>
                )}
              </div>
              {renderShadowMetric(totalShadow)}
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Evaluaciones totales</p>
                <p className="text-2xl font-semibold">{numberFormatter.format(summary.totals.total)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Checks exitosos</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {numberFormatter.format(summary.totals.pass)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Fallas detectadas</p>
                <p className="text-2xl font-semibold text-red-600">
                  {numberFormatter.format(summary.totals.fail)}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Feeds prioritarios</h3>
                <span className="text-xs text-muted-foreground">
                  Mostrando {feedHighlights.length} de {summary.feeds.length}
                </span>
              </div>

              {feedHighlights.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
                  No hay telemetría de feeds disponible.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {feedHighlights.map(feed => {
                    const severity = getSeverityConfig(feed.severity.status);
                    const trend = getTrendConfig(feed.trend.status);
                    const topRule = pickTopRule(feed.rules);
                    return (
                      <div key={feed.feed} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-xs uppercase text-slate-500">Feed</p>
                            <p className="font-semibold leading-tight break-words">{feed.feed}</p>
                          </div>
                          <Badge className={severity.badgeClass}>{severity.label}</Badge>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            {trend.icon}
                            <span>{trend.label}</span>
                          </div>
                          <span>Fallas {numberFormatter.format(feed.fail)}</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-600">Ratio {formatFailureRatio(feed.failureRatio)}</span>
                          <span className="text-xs text-muted-foreground">
                            Δ ratio {formatFailureRatio(feed.trend.delta.failureRatio, { allowNegative: true })}
                          </span>
                        </div>

                        {feed.shadowRmse && (
                          <div className="mt-3">
                            {renderShadowMetric(feed.shadowRmse)}
                          </div>
                        )}

                        {topRule && (
                          <div className="mt-3 rounded-md bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500">Regla sensible</p>
                            <p className="text-sm font-medium text-slate-700">{topRule.rule}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {topRule.severity.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          Última actualización: {lastUpdated ?? '—'} · Fuente `/api/read/oracle/dq/summary`
        </div>
        <div>Los datos se refrescan automáticamente cada 30 segundos.</div>
      </CardFooter>
    </Card>
  );
}
