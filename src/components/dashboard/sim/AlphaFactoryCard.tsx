'use client';

import { Activity, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { AlphaSignal } from '@/lib/alpha/moat/factory';

interface AlphaFactoryResponse {
  status: 'simulated';
  universe: string[];
  signals: AlphaSignal[];
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function AlphaFactoryCard() {
  const query = useSimulationQuery<AlphaFactoryResponse>({
    queryKey: ['sim', 'alpha', 'factory'],
    endpoint: '/api/alpha/factory',
    flag: 'FF_ALPHA_FACTORY_SIM',
    permission: 'feature:alpha-factory',
    refetchInterval: 90_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Alpha Factory"
          subtitle="Moat signals"
          icon={<Sparkles className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Activity className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM para generar señales cuantitativas."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Alpha Factory"
          subtitle="Moat signals"
          icon={<Sparkles className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Activity className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:alpha-factory. Solicita onboarding a Quant Research."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Alpha Factory"
          subtitle="Moat signals"
          icon={<Sparkles className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent className="space-y-3">
          <SkeletonPatterns.ListItem />
          <SkeletonPatterns.ListItem />
        </CardContent>
      </Card>
    );
  }

  if (query.error) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Alpha Factory"
          subtitle="Moat signals"
          icon={<Sparkles className="h-6 w-6" />}
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
        title="Alpha Factory"
        subtitle={`Universo base: ${data?.universe.slice(0, 5).join(', ').toUpperCase()}`}
        icon={<Sparkles className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {data?.signals.map(signal => (
            <div
              key={signal.id}
              className="rounded-xl border border-white/10 bg-black/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-amber-100">
                    {signal.label}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.35em] text-amber-200/60">
                    {signal.tags.join(' • ')}
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-100">
                  Convicción {Math.round(signal.conviction * 100)}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                  style={{ width: `${Math.min(signal.conviction * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-amber-100/60">
                <span>Sharpe esperado: {signal.expectedSharpRatio.toFixed(2)}</span>
                <span>Horizonte: {signal.horizonDays} días</span>
              </div>
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
