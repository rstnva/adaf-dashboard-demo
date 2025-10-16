'use client';

import { Globe, Send } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { CosmosExecutionResult, CosmosTask } from '@/lib/multichain/cosmos/executor';
import { formatCurrency } from '@/lib/utils/numberFormat';

interface CosmosExecutorResponse {
  status: 'simulated';
  task: CosmosTask;
  result: CosmosExecutionResult;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function CosmosExecutorCard() {
  const query = useSimulationQuery<CosmosExecutorResponse>({
    queryKey: ['sim', 'cosmos', 'executor'],
    endpoint: '/api/multichain/cosmos',
    flag: 'FF_COSMOS_EXECUTOR_SIM',
    permission: 'feature:cosmos-executor',
    refetchInterval: 150_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Cosmos Executor"
          subtitle="IBC dry-run"
          icon={<Globe className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Send className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_COSMOS_EXECUTOR_SIM para simular órdenes IBC."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Cosmos Executor"
          subtitle="IBC dry-run"
          icon={<Globe className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Send className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:cosmos-executor. Solicita acceso a Multichain Ops."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Cosmos Executor"
          subtitle="IBC dry-run"
          icon={<Globe className="h-6 w-6" />}
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
          title="Cosmos Executor"
          subtitle="IBC dry-run"
          icon={<Globe className="h-6 w-6" />}
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
        title="Cosmos Executor"
        subtitle={`Cadena ${data?.task.chain} • Acción ${data?.task.action}`}
        icon={<Globe className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SimMetric
            label="Notional"
            value={formatCurrency(data?.task.notionalUsd ?? 0, 'USD', true)}
            trend={`Slippage ${data?.task.slippageBps} bps`}
          />
          <SimMetric
            label="Estado"
            value={data?.result.accepted ? 'En cola' : 'Rechazado'}
            trend={data?.result.memo}
          />
          <SimMetric
            label="Tiempo estimado"
            value={`${Math.round(data?.result.estimatedCompletionSeconds ?? 0)} s`}
            trend="Dry-run"
          />
        </div>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
