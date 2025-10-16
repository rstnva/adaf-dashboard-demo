'use client';

import { Layers, Server } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetric, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { BlockBuildRequest, BlockBuildResult } from '@/lib/blockspace/builder';
import type { DeskExecution, DeskOrder } from '@/lib/blockspace/desk';

interface BlockspaceBuilderResponse {
  status: 'simulated';
  request: BlockBuildRequest;
  result: BlockBuildResult;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

interface BlockspaceDeskResponse {
  status: 'simulated';
  order: DeskOrder;
  execution: DeskExecution;
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function BlockspaceOpsCard() {
  const builderQuery = useSimulationQuery<BlockspaceBuilderResponse>({
    queryKey: ['sim', 'blockspace', 'builder'],
    endpoint: '/api/blockspace/builder',
    flag: 'FF_BLOCKSPACE_SIM',
    permission: 'feature:blockspace',
    refetchInterval: 90_000,
  });

  const deskQuery = useSimulationQuery<BlockspaceDeskResponse>({
    queryKey: ['sim', 'blockspace', 'desk'],
    endpoint: '/api/blockspace/desk',
    flag: 'FF_BLOCKSPACE_SIM',
    permission: 'feature:blockspace',
    refetchInterval: 120_000,
  });

  const gateFlag = builderQuery.flagEnabled && deskQuery.flagEnabled;
  const gatePermission = builderQuery.permissionGranted && deskQuery.permissionGranted;

  if (!gateFlag) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Blockspace Ops"
          subtitle="Desk + Builder Dry-Run"
          icon={<Layers className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Server className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_BLOCKSPACE_SIM para habilitar las simulaciones de blockspace."
          />
        </CardContent>
      </Card>
    );
  }

  if (!gatePermission) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Blockspace Ops"
          subtitle="Desk + Builder Dry-Run"
          icon={<Layers className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Server className="h-5 w-5" />}
            title="Acceso restringido"
            message="Tu rol actual no tiene permisos feature:blockspace. Solicita acceso al equipo de gobernanza."
          />
        </CardContent>
      </Card>
    );
  }

  if (builderQuery.isLoading || deskQuery.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Blockspace Ops"
          subtitle="Desk + Builder Dry-Run"
          icon={<Layers className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent className="space-y-6">
          <SkeletonPatterns.MetricValue />
          <SkeletonPatterns.ListItem />
        </CardContent>
      </Card>
    );
  }

  if (builderQuery.error || deskQuery.error) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Blockspace Ops"
          subtitle="Desk + Builder Dry-Run"
          icon={<Layers className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState
            variant="minimal"
            error={(builderQuery.error || deskQuery.error) as Error}
            onRetry={() => {
              builderQuery.refetch();
              deskQuery.refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const builder = builderQuery.data;
  const desk = deskQuery.data;
  const meta = builder?.meta ?? desk?.meta;

  return (
    <Card className="adaf-card">
      <CardHeader
        title="Blockspace Ops"
        subtitle="Desk + Builder Dry-Run"
        icon={<Layers className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SimMetric
            label="Builder Accepted"
            value={builder?.result.accepted ? 'Sí' : 'No'}
            trend={`Rebate efectivo: ${builder?.result.effectiveRebateBps ?? 0} bps`}
          />
          <SimMetric
            label="Desk Fee"
            value={`${desk?.execution.feeBps ?? 0} bps`}
            trend={desk?.execution.accepted ? 'Orden aceptada' : 'Orden rechazada'}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-amber-100/80">
          <div className="font-medium text-amber-100">Último bundle simulado</div>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                Bundle ID
              </span>
              <div className="truncate text-sm font-semibold text-amber-100">
                {builder?.request.bundleId}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                Latencia simulada
              </span>
              <div className="text-sm font-semibold text-amber-100">
                {builder?.result.latencyMs} ms
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-amber-100/50">
                Orden desk
              </span>
              <div className="text-sm font-semibold text-amber-100">
                {desk?.order.id} · {desk?.order.priority} · {desk?.order.venue}
              </div>
            </div>
            {desk?.execution.notes && (
              <div className="text-xs text-amber-100/60">
                {desk.execution.notes}
              </div>
            )}
          </div>
        </div>

        <SimMetaBar
          correlationId={meta?.correlationId}
          durationMs={meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
