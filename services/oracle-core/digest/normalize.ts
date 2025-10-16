import type { Signal } from '../registry/schema';

export interface RawSignalLike extends Omit<Signal, 'ts' | 'stale' | 'rev'> {
  ts: string | Date;
  stale?: boolean;
  rev?: number;
}

const MEXICO_CITY = 'America/Mexico_City';

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);

  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '0';
  const year = Number(get('year'));
  const month = Number(get('month')) - 1;
  const day = Number(get('day'));
  const hour = Number(get('hour'));
  const minute = Number(get('minute'));
  const second = Number(get('second'));
  const offsetFragment = get('timeZoneName');

  const offsetSign = offsetFragment.includes('-') ? -1 : 1;
  const offsetParts = offsetFragment.match(/(-|\+)(\d{1,2})(?::?(\d{2}))?/);
  const offsetHours = offsetParts ? Number(offsetParts[2]) : 0;
  const offsetMinutes = offsetParts && offsetParts[3] ? Number(offsetParts[3]) : 0;
  const offsetTotalMinutes = offsetSign * (offsetHours * 60 + offsetMinutes);

  const tzTime = Date.UTC(year, month, day, hour, minute, second);
  const utcTime = date.getTime();
  const derivedOffsetMinutes = Math.round((tzTime - utcTime) / 60000);

  return Number.isNaN(derivedOffsetMinutes) ? offsetTotalMinutes : derivedOffsetMinutes;
}

export function normalizeSignal(input: RawSignalLike): Signal {
  const date = new Date(input.ts);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid timestamp');
  }

  const offsetMinutes = getTimeZoneOffset(date, MEXICO_CITY);
  const normalizedDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);

  return {
    ...input,
    ts: normalizedDate.toISOString(),
    stale: input.stale ?? false,
    rev: input.rev ?? 0,
  };
}
