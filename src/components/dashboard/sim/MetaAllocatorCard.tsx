'use client';

import { Network, Shield } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type {
  AllocationCandidate,
  AllocationConstraint,
  AllocationDecision,
} from '@/lib/allocator/meta/router';
import { formatCurrency, formatPercent } from '@/lib/utils/numberFormat';

interface MetaAllocatorResponse {
  status: 'simulated';
  capitalUsd: number;
  candidate: AllocationCandidate;
  constraints: AllocationConstraint[];
  decision: AllocationDecision;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function MetaAllocatorCard() {
  const query = useSimulationQuery<MetaAllocatorResponse>({
    queryKey: ['sim', 'allocator', 'meta'],
    endpoint: '/api/allocator/meta',
    flag: 'FF_ALPHA_FACTORY_SIM',
    permission: 'feature:alpha-factory',
    refetchInterval: 120_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Meta Allocator"
          subtitle="Capital Routing"
          icon={<Network className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Shield className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM para probar asignaciones de capital."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Meta Allocator"
          subtitle="Capital Routing"
          icon={<Network className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Shield className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:alpha-factory. Solicita acceso a Portfolio Engineering."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Meta Allocator"
          subtitle="Capital Routing"
          icon={<Network className="h-6 w-6" />}
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
          title="Meta Allocator"
          subtitle="Capital Routing"
          icon={<Network className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState variant="minimal" error={query.error as Error} onRetry={query.refetch} />
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  const breaches = data?.decision.constraintBreaches ?? [];

  return (
    <Card className="adaf-card">
      <CardHeader
        title="Meta Allocator"
        subtitle={`Capital disponible: ${formatCurrency(data?.capitalUsd ?? 0, 'USD', true)}`}
        icon={<Network className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Capital sugerido"
            value={formatCurrency(data?.candidate.capitalSuggestedUsd ?? 0, 'USD', true)}
            trend={`Sharpe ${data?.candidate.sharpe.toFixed(2)}`}
          />
          <SimMetric
            label="Convicción"
            value={`${Math.round((data?.candidate.conviction ?? 0) * 100)}%`}
            trend={`Signal ${data?.candidate.signalId}`}
          />
          <SimMetric
            label="Capital asignado"
            value={formatCurrency(data?.decision.capitalAllocatedUsd ?? 0, 'USD', true)}
            trend={breaches.length ? 'Bloqueado por constraints' : 'Asignación aprobada'}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-amber-100/80">
          <div className="font-medium text-amber-100">Control de riesgos</div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {data?.constraints.map(constraint => (
              <div key={constraint.id} className="rounded-lg border border-white/5 bg-black/30 p-3">
                <div className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                  {constraint.id}
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-100">
                  Exposición máx: {formatPercent((constraint.maxExposureBps ?? 0) / 100)}
                </div>
                <div className="mt-1 text-xs text-amber-100/60">
                  Sharpe mínimo: {constraint.minSharpe.toFixed(2)} • Cooldown {constraint.cooldownDays} días
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-100/60">
            {data?.decision.reason}
          </p>
          {breaches.length > 0 && (
            <div className="mt-3 text-xs text-rose-200/80">
              Constraints afectados: {breaches.join(', ')}
            </div>
          )}
        </div>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
