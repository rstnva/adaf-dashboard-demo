"use client";

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  OctagonAlert,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { NavigationGuard } from '@/components/NavigationGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOracleDQSummary } from '@/hooks';

type Check = { healthy: boolean; message?: string; error?: string };
type Health = { status: string; timestamp: string; checks?: Record<string, Check> };

const percentageFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('es-MX');

const severityConfig = {
  healthy: {
    label: 'Saludable',
    badgeClass: 'adaf-badge-severity-ok',
    textClass: 'text-emerald-700',
    icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
  },
  warning: {
    label: 'Advertencia',
    badgeClass: 'adaf-badge-severity-amber',
    textClass: 'text-amber-700',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  },
  critical: {
    label: 'Crítico',
    badgeClass: 'adaf-badge-severity-red',
    textClass: 'text-red-700',
    icon: <OctagonAlert className="h-5 w-5 text-red-600" />,
  },
} as const;

const trendConfig = {
  improving: {
    label: 'Mejorando',
    icon: <ArrowDownRight className="h-4 w-4 text-emerald-600" />,
    chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  stable: {
    label: 'Estable',
    icon: <Minus className="h-4 w-4 text-slate-500" />,
    chipClass: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  deteriorating: {
    label: 'Deteriorando',
    icon: <ArrowUpRight className="h-4 w-4 text-red-600" />,
    chipClass: 'border-red-200 bg-red-50 text-red-700',
  },
} as const;

function formatRatio(value?: number, allowNegative = false) {
  if (!Number.isFinite(value ?? NaN)) return '—';
  const ratio = allowNegative ? value! : Math.max(value!, 0);
  return percentageFormatter.format(ratio);
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    summary: dqSummary,
    isLoading: dqLoading,
    error: dqError,
    refetch: refetchDq,
  } = useOracleDQSummary();

  async function load(deep = false, forceReal = false) {
    setLoading(true);
    setError(null);
    try {
      const url = deep ? `/api/health?deep=1&timeout=2500${forceReal ? '&force=real' : ''}` : '/api/health';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setHealth(data);
      if (!res.ok) setError('Alguna verificación falló');
    } catch (e: any) {
      setError(e?.message || 'Error cargando estado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  const checks = health?.checks || {};
  const items = Object.entries(checks);

  const topFeed = useMemo(() => {
    if (!dqSummary?.feeds || dqSummary.feeds.length === 0) return null;
    return [...dqSummary.feeds].sort((a, b) => b.failureRatio - a.failureRatio || b.fail - a.fail)[0];
  }, [dqSummary]);

  const topRule = useMemo(() => {
    if (!topFeed?.rules || topFeed.rules.length === 0) return null;
    return [...topFeed.rules].sort((a, b) => b.failureRatio - a.failureRatio || b.fail - a.fail)[0];
  }, [topFeed]);

  const severity = dqSummary ? severityConfig[dqSummary.totals.severity.status] : null;
  const trend = dqSummary ? trendConfig[dqSummary.totals.trend.status] : null;
  const dqUpdatedAt = dqSummary?.generatedAt
    ? formatDistanceToNow(new Date(dqSummary.generatedAt), { addSuffix: true })
    : null;

  return (
    <NavigationGuard fallbackUrl="/" storageKey="monitoring-panel">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-gray-600">Estado del sistema y diagnósticos rápidos.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => load(false)} className="px-3 py-2 rounded-md bg-blue-600 text-white">
            Refrescar
          </button>
          <button onClick={() => load(true)} className="px-3 py-2 rounded-md bg-amber-600 text-white">
            Chequeo profundo
          </button>
          <button onClick={() => load(true, true)} className="px-3 py-2 rounded-md bg-red-600 text-white">
            Profundo (forzar real)
          </button>
          <a href="/api/health" target="_blank" className="px-3 py-2 rounded-md border">
            Ver JSON
          </a>
          <a href="/api/health?deep=1" target="_blank" className="px-3 py-2 rounded-md border">
            Ver JSON (deep)
          </a>
          <a href="/api/health?deep=1&force=real" target="_blank" className="px-3 py-2 rounded-md border">
            Ver JSON (deep, real)
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            {loading && <div className="text-gray-500">Cargando…</div>}
            {!loading && error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800">{error}</div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.length === 0 && (
                  <div className="p-4 rounded-md border bg-white">
                    No hay checks en modo shallow. Usa “Chequeo profundo”.
                  </div>
                )}
                {items.map(([name, c]) => (
                  <div
                    key={name}
                    className={`p-4 rounded-md border bg-white ${c.healthy ? 'border-green-300' : 'border-red-300'}`}
                  >
                    <div className="font-semibold flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                      {name}
                    </div>
                    <div className="text-sm text-gray-700 mt-2">{c.message || (c.healthy ? 'OK' : 'Fallo')}</div>
                    {c.error && <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">{c.error}</pre>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-slate-500">Oráculo ADAF</p>
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    Calidad de datos
                    {severity && <Badge className={severity.badgeClass}>{severity.label}</Badge>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchDq()}
                  disabled={dqLoading}
                  className="text-xs"
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> Refrescar telemetría
                </Button>
              </div>

              <div className="space-y-4 p-4">
                {dqLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando con Prometheus…
                  </div>
                )}

                {!dqLoading && dqError instanceof Error && (
                  <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <OctagonAlert className="h-4 w-4" /> {dqError.message}
                  </div>
                )}

                {!dqLoading && !dqError && dqSummary && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {severity?.icon}
                            <span className={`text-xl font-semibold ${severity?.textClass ?? ''}`}>
                              {severity?.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 max-w-md">
                            {dqSummary.totals.severity.recommendation}
                          </p>
                        </div>
                        {trend && (
                          <div
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${trend.chipClass}`}
                          >
                            {trend.icon}
                            {trend.label}
                            <span className="text-[11px] text-slate-600">
                              Δ fallas {numberFormatter.format(dqSummary.totals.trend.delta.fail)} · Δ ratio{' '}
                              {formatRatio(dqSummary.totals.trend.delta.failureRatio, true)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground uppercase">Evaluaciones</p>
                        <p className="text-xl font-semibold text-slate-800">
                          {numberFormatter.format(dqSummary.totals.total)}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground uppercase">Checks OK</p>
                        <p className="text-xl font-semibold text-emerald-600">
                          {numberFormatter.format(dqSummary.totals.pass)}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground uppercase">Fallas</p>
                        <p className="text-xl font-semibold text-red-600">
                          {numberFormatter.format(dqSummary.totals.fail)}
                        </p>
                      </div>
                    </div>

                    {topFeed && (
                      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase text-slate-500">Feed bajo observación</p>
                            <p className="text-sm font-semibold text-slate-800">{topFeed.feed}</p>
                          </div>
                          <Badge className={severityConfig[topFeed.severity.status].badgeClass}>
                            {severityConfig[topFeed.severity.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            {trendConfig[topFeed.trend.status].icon}
                            {trendConfig[topFeed.trend.status].label}
                          </span>
                          <span>Fallas {numberFormatter.format(topFeed.fail)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            Ratio {formatRatio(topFeed.failureRatio)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Δ ratio {formatRatio(topFeed.trend.delta.failureRatio, true)}
                          </span>
                        </div>

                        {topRule && (
                          <div className="rounded-md bg-slate-50 p-3">
                            <p className="text-[11px] uppercase text-slate-500">Regla crítica</p>
                            <p className="text-sm font-medium text-slate-700">{topRule.rule}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {topRule.severity.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 border-t border-slate-100 p-4 text-[11px] text-muted-foreground">
                <span>Última actualización: {dqUpdatedAt ?? '—'}</span>
                <span>Origen: /api/read/oracle/dq/summary · Refresco automático cada 30s</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </NavigationGuard>
  );
}
