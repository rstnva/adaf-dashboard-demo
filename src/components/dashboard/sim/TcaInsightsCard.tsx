'use client';

import { ArrowRightLeft, ChartLine } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetaBar, SimMetric } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { TcaBreakdown, TcaInput } from '@/lib/tca/analyzer';
import { formatCurrency } from '@/lib/utils/numberFormat';

interface TcaResponse {
  status: 'simulated';
  request: TcaInput;
  breakdown: TcaBreakdown;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function TcaInsightsCard() {
  const query = useSimulationQuery<TcaResponse>({
    queryKey: ['sim', 'tca'],
    endpoint: '/api/tca',
    flag: 'FF_TCA_SIM',
    permission: 'feature:tca',
    refetchInterval: 90_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="TCA Insights"
          subtitle="Routing analyzer"
          icon={<ChartLine className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_TCA_SIM para analizar costos de ejecución."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="TCA Insights"
          subtitle="Routing analyzer"
          icon={<ChartLine className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:tca. Solicita acceso a Execution Ops."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="TCA Insights"
          subtitle="Routing analyzer"
          icon={<ChartLine className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SkeletonPatterns.MetricValue />
        </CardContent>
      </Card>
    );
  }

  if (query.error) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="TCA Insights"
          subtitle="Routing analyzer"
          icon={<ChartLine className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState variant="minimal" error={query.error as Error} onRetry={query.refetch} />
        </CardContent>
      </Card>
    );
  }

  const data = query.data;

  return (
    <Card className="adaf-card">
      <CardHeader
        title="TCA Insights"
        subtitle={`Orden ${data?.request.orderId} • Notional ${formatCurrency(data?.request.notionalUsd ?? 0, 'USD', true)}`}
        icon={<ChartLine className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Slippage esperado"
            value={`${data?.breakdown.expectedSlippageBps.toFixed(2)} bps`}
            trend={`Urgencia ${data?.request.urgency}`}
          />
          <SimMetric
            label="ADV"
            value={formatCurrency(data?.request.avgDailyVolumeUsd ?? 0, 'USD', true)}
            trend="Dry-run"
          />
          <SimMetric
            label="Modo sim"
            value="TCA"
            trend={`Venues analizados: ${data?.breakdown.venueComparisons.length}`}
          />
        </div>

        <div className="space-y-3">
          {data?.breakdown.venueComparisons.map(venue => (
            <div
              key={venue.venue}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-amber-100/80"
            >
              <div className="font-semibold text-amber-100">{venue.venue}</div>
              <div>{venue.impactBps.toFixed(2)} bps impacto</div>
              <div>{venue.estimatedCompletionMinutes} min</div>
            </div>
          ))}
        </div>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
