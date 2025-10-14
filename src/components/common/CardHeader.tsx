/**
 * Unified card header with consistent as-of timestamp formatting
 */

import { formatTimestamp } from '@/lib/utils/timeFormat';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  asOf?: string | Date;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  asOf,
  icon,
  badge,
  actions,
  className,
}: CardHeaderProps) {
  const { timezone } = useUIStore();

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-amber-200/80">{icon}</div>}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-amber-100">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-amber-100/70">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-amber-100/70">
        {actions}
        {asOf && (
          <span className="text-xs uppercase tracking-[0.25em]">
            As of {formatTimestamp(asOf, timezone, { style: 'relative' })}
          </span>
        )}
      </div>
    </div>
  );
}
