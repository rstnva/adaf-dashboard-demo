'use client';

import { Activity, Waves } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { VolScenarioInput, VolScenarioResult } from '@/lib/volpro/engine';
import { formatCurrency } from '@/lib/utils/numberFormat';

interface VolProResponse {
  status: 'simulated';
  scenario: VolScenarioInput;
  result: VolScenarioResult;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

const STRUCTURE_LABELS: Record<VolScenarioResult['recommendedStructure'], string> = {
  collar: 'Collar protectivo',
  'put-spread': 'Put Spread',
  calendar: 'Calendar spread',
  'covered-call': 'Covered call',
};

export function VolProCard() {
  const query = useSimulationQuery<VolProResponse>({
    queryKey: ['sim', 'volpro'],
    endpoint: '/api/volpro',
    flag: 'FF_VOL_PRO_SIM',
    permission: 'feature:vol-pro',
    refetchInterval: 150_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Volatility Pro"
          subtitle="Cobertura dinámica"
          icon={<Waves className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Activity className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_VOL_PRO_SIM para planear coberturas."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Volatility Pro"
          subtitle="Cobertura dinámica"
          icon={<Waves className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Activity className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:vol-pro. Solicita acceso a Derivatives Desk."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Volatility Pro"
          subtitle="Cobertura dinámica"
          icon={<Waves className="h-6 w-6" />}
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
          title="Volatility Pro"
          subtitle="Cobertura dinámica"
          icon={<Waves className="h-6 w-6" />}
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
        title="Volatility Pro"
        subtitle={`Escenario ${data?.scenario.asset.toUpperCase()} · Realizada ${Math.round((data?.scenario.realizedVol ?? 0) * 100)}% vs Implícita ${Math.round((data?.scenario.impliedVol ?? 0) * 100)}%`}
        icon={<Waves className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Skew"
            value={`${(data?.result.skew ?? 0).toFixed(2)}%`}
            trend={`Budget ${data?.scenario.hedgeBudgetBps} bps`}
          />
          <SimMetric
            label="Notional cobertura"
            value={formatCurrency(data?.result.hedgeNotionalUsd ?? 0, 'USD', true)}
            trend={`Estructura ${STRUCTURE_LABELS[data?.result.recommendedStructure ?? 'collar']}`}
          />
          <SimMetric
            label="Modo sim"
            value={data?.result.recommendedStructure.toUpperCase()}
            trend="Ejecución dry-run"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-amber-100/80">
          <div className="font-medium text-amber-100">Playbook recomendado</div>
          <p className="mt-2 text-xs text-amber-100/60">
            Utiliza esta simulación para calibrar coberturas antes de enviarlas al comité de derivados. Todas las órdenes permanecen en modo sim-only y requieren validación humana antes de ejecutarse en vivo.
          </p>
        </div>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
