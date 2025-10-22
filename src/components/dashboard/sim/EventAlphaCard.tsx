'use client';

import { AlertTriangle, CalendarClock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { SimBadge, SimGateMessage, SimMetaBar } from './SimCardPrimitives';
import { useSimulationQuery } from '@/lib/api/useSimulationQuery';
import type { EventAlphaScore, EventCatalyst } from '@/lib/events/eventAlphaEngine';

interface EventAlphaResponse {
  status: 'simulated';
  catalysts: EventCatalyst[];
  scores: EventAlphaScore[];
  meta?: {
    correlationId?: string;
    durationMs?: number;
  };
}

const severityColor: Record<EventCatalyst['severity'], string> = {
  high: 'bg-rose-500/20 text-rose-100',
  medium: 'bg-amber-500/20 text-amber-100',
  low: 'bg-sky-500/20 text-sky-100',
};

export function EventAlphaCard() {
  const query = useSimulationQuery<EventAlphaResponse>({
    queryKey: ['sim', 'events', 'alpha'],
    endpoint: '/api/events/alpha',
    flag: 'FF_EVENT_ALPHA_SIM',
    permission: 'feature:event-alpha',
    refetchInterval: 120_000,
  });

  if (!query.flagEnabled) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Event Alpha"
          subtitle="Catalizadores prioritarios"
          icon={<CalendarClock className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Feature flag deshabilitada"
            message="Activa NEXT_PUBLIC_FF_EVENT_ALPHA_SIM para evaluar eventos."
          />
        </CardContent>
      </Card>
    );
  }

  if (!query.permissionGranted) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Event Alpha"
          subtitle="Catalizadores prioritarios"
          icon={<CalendarClock className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SimGateMessage
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Acceso restringido"
            message="Requiere permiso feature:event-alpha. Solicita acceso a Macro & Governance."
          />
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Event Alpha"
          subtitle="Catalizadores prioritarios"
          icon={<CalendarClock className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <SkeletonPatterns.ListItem />
        </CardContent>
      </Card>
    );
  }

  if (query.error) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="Event Alpha"
          subtitle="Catalizadores prioritarios"
          icon={<CalendarClock className="h-6 w-6" />}
          badge={SimBadge}
        />
        <CardContent>
          <ErrorState variant="minimal" error={query.error as Error} onRetry={query.refetch} />
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  const catalysts = data?.catalysts ?? [];
  const scoresById = new Map((data?.scores ?? []).map(score => [score.id, score]));

  return (
    <Card className="adaf-card">
      <CardHeader
        title="Event Alpha"
        subtitle={catalysts.length ? `${catalysts.length} eventos monitoreados` : 'Sin eventos activos'}
        icon={<CalendarClock className="h-6 w-6 text-amber-200" />}
        badge={SimBadge}
      />
      <CardContent className="space-y-4">
        {catalysts.map(catalyst => {
          const score = scoresById.get(catalyst.id);
          return (
            <div
              key={catalyst.id}
              className="rounded-xl border border-white/10 bg-black/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-amber-100">
                    {catalyst.id.replace(/-/g, ' ').toUpperCase()}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.35em] text-amber-200/60">
                    {catalyst.category} • {catalyst.affectedAssets.join(', ').toUpperCase()}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityColor[catalyst.severity]}`}>
                  Severidad {catalyst.severity.toUpperCase()}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-amber-100/70 md:grid-cols-3">
                <div>
                  Score: <span className="font-semibold text-amber-100">{score?.score.toFixed(2)}</span>
                </div>
                <div>
                  Playbook: <span className="font-semibold text-amber-100">{score?.playbook}</span>
                </div>
                <div>
                  TTL: <span className="font-semibold text-amber-100">{score?.ttlMinutes} min</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-amber-100/60">
                Evento en {Math.round(catalyst.timeToEventHours)}h — seguimiento en modo dry-run.
              </div>
            </div>
          );
        })}

        {!catalysts.length && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-6 text-center text-sm text-amber-100/60">
            Sin eventos de alto impacto en el backlog. El motor sigue monitoreando fuentes macro, governance y regulatorias.
          </div>
        )}

        <SimMetaBar
          correlationId={data?.meta?.correlationId}
          durationMs={data?.meta?.durationMs}
        />
      </CardContent>
    </Card>
  );
}
