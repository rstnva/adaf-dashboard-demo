'use client';

import { Droplet, LifeBuoy } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { LiquidityBackstopPlan, LiquidityShockInput } from '@/lib/liquidity/backstop';
import { formatCurrency } from '@/lib/utils/numberFormat';

interface LiquidityBackstopResponse {
  status: 'simulated';
  request: LiquidityShockInput;
  plan: LiquidityBackstopPlan;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function LiquidityBackstopCard() {
  const query = useSimulationQuery<LiquidityBackstopResponse>({
    queryKey: ['sim', 'liquidity', 'backstop'],
    endpoint: '/api/liquidity/backstop',
    flag: 'FF_LIQUIDITY_BACKSTOP_SIM',
    permission: 'feature:liquidity-backstop',
    refetchInterval: 180_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Liquidity Backstop"
          subtitle="Reservas de contingencia"
          icon={<LifeBuoy className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Droplet className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_LIQUIDITY_BACKSTOP_SIM para calcular reservas de liquidez."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Liquidity Backstop"
          subtitle="Reservas de contingencia"
          icon={<LifeBuoy className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Droplet className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:liquidity-backstop. Solicita acceso a Treasury Ops."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Liquidity Backstop"
          subtitle="Reservas de contingencia"
          icon={<LifeBuoy className="h-6 w-6" />}
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
          title="Liquidity Backstop"
          subtitle="Reservas de contingencia"
          icon={<LifeBuoy className="h-6 w-6" />}
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
        title="Liquidity Backstop"
        subtitle={`Desk ${data?.request.desk} • Volatility index ${data?.request.volatilityIndex}`}
        icon={<LifeBuoy className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Top-up requerido"
            value={formatCurrency(data?.plan.topUpUsd ?? 0, 'USD', true)}
            trend={`Multiplier ${data?.plan.reserveMultiplier.toFixed(2)}x`}
          />
          <SimMetric
            label="Liquidez actual"
            value={formatCurrency(data?.request.currentLiquidityUsd ?? 0, 'USD', true)}
            trend={`Peak flujo ${formatCurrency(data?.request.peakOutflowUsd ?? 0, 'USD', true)}`}
          />
          <SimMetric
            label="Activación"
            value={formatCurrency(data?.plan.activationThresholdUsd ?? 0, 'USD', true)}
            trend="Dry-run"
          />
        </div>

        <p className="text-xs text-amber-100/60">
          Este cálculo es exclusivo para simulaciones y ayuda a documentar requerimientos previos a cualquier despliegue en producción. Alinea las reservas propuestas con el comité de riesgo antes de mover capital real.
        </p>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
