'use client';

import { ShieldCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { VaultSimulationInput, VaultSimulationResult } from '@/lib/vaults/lav/simulator';
import { formatCurrency, formatPercent } from '@/lib/utils/numberFormat';

interface VaultsLavResponse {
  status: 'simulated';
  request: VaultSimulationInput;
  result: VaultSimulationResult;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function VaultsLavCard() {
  const query = useSimulationQuery<VaultsLavResponse>({
    queryKey: ['sim', 'vaults', 'lav'],
    endpoint: '/api/vaults/lav',
    flag: 'FF_VAULTS_LAV_SIM',
    permission: 'feature:vaults-lav',
    refetchInterval: 180_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Vaults LAV"
          subtitle="Proyección institucional"
          icon={<ShieldCheck className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_VAULTS_LAV_SIM para simular escenarios de vaults."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Vaults LAV"
          subtitle="Proyección institucional"
          icon={<ShieldCheck className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:vaults-lav. Coordina con Risk & Governance."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Vaults LAV"
          subtitle="Proyección institucional"
          icon={<ShieldCheck className="h-6 w-6" />}
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
          title="Vaults LAV"
          subtitle="Proyección institucional"
    icon={<ShieldCheck className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState variant="minimal" error={query.error as Error} onRetry={query.refetch} />
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  const projected = data?.result;
  const input = data?.request;

  const endingNav = projected?.navProjection.at(-1) ?? input?.depositUsd ?? 0;

  return (
    <Card className="adaf-card">
      <CardHeader
        title="Vaults LAV"
        subtitle={input ? `${input.riskProfile.name} • ${input.tenorDays} días` : 'Configuración sim estándar'}
          icon={<ShieldCheck className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Depósito"
            value={formatCurrency(input?.depositUsd ?? 0, 'USD', true)}
          />
          <SimMetric
            label="NAV proyectado"
            value={formatCurrency(endingNav, 'USD', true)}
            trend={`Liquidez ${input?.riskProfile.liquidityBand}`}
          />
          <SimMetric
            label="Sharpe estimado"
            value={projected?.sharpeEstimate?.toFixed(2) ?? '0.00'}
            trend={`Stress loss: ${formatPercent((projected?.stressLossBps ?? 0) / 100)}`}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-amber-100/80">
          <div className="font-medium text-amber-100">Retorno objetivo</div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-100">
              {formatPercent((projected?.projectedReturnBps ?? 0) / 100)} esperado
            </span>
            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-100">
              {formatPercent((projected?.stressLossBps ?? 0) / 100)} stress
            </span>
          </div>
          <p className="mt-3 text-xs text-amber-100/60">
            Esta simulación se ejecuta en modo dry-run y no compromete capital real. Usa los resultados para calibrar propuestas antes de enviar a comités.
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
