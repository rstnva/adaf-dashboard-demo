const UNIT_ALIASES: Record<string, string> = {
  usd: 'usd',
  USD: 'usd',
  index: 'index',
  percentage: 'pct',
  pct: 'pct',
  bps: 'bps',
};

export function normalizeUnit(unit: string): string {
  return UNIT_ALIASES[unit] ?? unit.toLowerCase();
}
