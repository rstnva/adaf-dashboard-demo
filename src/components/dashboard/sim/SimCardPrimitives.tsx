'use client';

import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const SimBadge = (
  <Badge
    variant="outline"
    className="border-amber-400/60 bg-amber-500/10 text-amber-100"
  >
    Sim Only
  </Badge>
);

interface SimGateMessageProps {
  icon: ReactNode;
  title: string;
  message: string;
  className?: string;
  actions?: ReactNode;
}

export function SimGateMessage({ icon, title, message, className, actions }: SimGateMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-300/40 bg-amber-500/5 px-6 py-10 text-center text-amber-100/80',
        className
      )}
    >
      <div className="rounded-full bg-amber-500/10 p-3 text-amber-200">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold tracking-tight text-amber-100">
          {title}
        </h4>
        <p className="mt-2 text-sm text-amber-100/70">{message}</p>
      </div>
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

interface SimMetricProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
}

export function SimMetric({ label, value, trend }: SimMetricProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-[0.35em] text-amber-200/50">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-amber-100">{value}</div>
      {trend && <div className="mt-1 text-xs text-amber-100/60">{trend}</div>}
    </div>
  );
}

export function SimMetaBar({
  correlationId,
  durationMs,
}: {
  correlationId?: string;
  durationMs?: number;
}) {
  if (!correlationId && !durationMs) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-amber-200/60">
      {correlationId && (
        <span className="truncate" title={correlationId}>
          CID: {correlationId}
        </span>
      )}
      {typeof durationMs === 'number' && (
        <span>Latency: {durationMs.toFixed(0)} ms</span>
      )}
    </div>
  );
}
