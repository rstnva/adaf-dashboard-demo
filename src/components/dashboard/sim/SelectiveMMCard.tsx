'use client';

import { Building2, Repeat } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { MarketMakingDecision, MarketMakingMandate, VenueProfile } from '@/lib/mm/selectiveMarketMaker';
import { formatCurrency } from '@/lib/utils/numberFormat';

interface SelectiveMMResponse {
  status: 'simulated';
  mandate: MarketMakingMandate;
  venues: VenueProfile[];
  decisions: MarketMakingDecision[];
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

export function SelectiveMMCard() {
  const query = useSimulationQuery<SelectiveMMResponse>({
    queryKey: ['sim', 'mm', 'selective'],
    endpoint: '/api/mm/selective',
    flag: 'FF_MM_SELECTIVE_SIM',
    permission: 'feature:mm-selective',
    refetchInterval: 120_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Selective Market Making"
          subtitle="Venue screening"
          icon={<Repeat className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Building2 className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_MM_SELECTIVE_SIM para evaluar venues."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Selective Market Making"
          subtitle="Venue screening"
          icon={<Repeat className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<Building2 className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:mm-selective. Solicita acceso a MM Desk."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Selective Market Making"
          subtitle="Venue screening"
          icon={<Repeat className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SkeletonPatterns.Table rows={3} />
        </CardContent>
      </Card>
    );
  }

  if (query.error) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Selective Market Making"
          subtitle="Venue screening"
          icon={<Repeat className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState variant="minimal" error={query.error as Error} onRetry={query.refetch} />
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  const decisionsByVenue = new Map((data?.decisions ?? []).map(decision => [decision.venueId, decision]));

  return (
    <Card className="adaf-card">
      <CardHeader
        title="Selective Market Making"
        subtitle={`Mandato ${data?.mandate.asset} • Spread objetivo ${data?.mandate.targetSpreadBps} bps`}
        icon={<Repeat className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-amber-100/80">
            <thead className="bg-black/50 text-xs uppercase tracking-[0.3em] text-amber-200/60">
              <tr>
                <th className="px-4 py-3 text-left">Venue</th>
                <th className="px-4 py-3 text-center">Calidad</th>
                <th className="px-4 py-3 text-center">Fee</th>
                <th className="px-4 py-3 text-center">Liquidez</th>
                <th className="px-4 py-3 text-center">Decisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/40">
              {data?.venues.map(venue => {
                const decision = decisionsByVenue.get(venue.id);
                const approved = decision?.provideLiquidity ?? false;
                return (
                  <tr key={venue.id}>
                    <td className="px-4 py-3 font-semibold text-amber-100">{venue.name}</td>
                    <td className="px-4 py-3 text-center">{Math.round(venue.qualityScore * 100)}%</td>
                    <td className="px-4 py-3 text-center">{venue.feeBps} bps</td>
                    <td className="px-4 py-3 text-center">
                      {formatCurrency(decision?.inventoryCapUsd ?? 0, 'USD', true)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${approved ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}
                      >
                        {approved ? 'Onboarding' : 'Bloqueado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-amber-100/60">
          Inventario mínimo: {formatCurrency(data?.mandate.minInventoryUsd ?? 0, 'USD', true)} • Máximo: {formatCurrency(data?.mandate.maxInventoryUsd ?? 0, 'USD', true)}
        </div>

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
