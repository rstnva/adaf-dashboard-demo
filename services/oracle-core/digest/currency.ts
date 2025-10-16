const MOCK_RATES: Record<string, number> = {
  USD: 1,
  MXN: 16.8,
  EUR: 0.92,
  BTC: 1 / 68000,
  ETH: 1 / 3200,
};

export function convertCurrency(value: number, from: string, to: string): number {
  if (from === to) {
    return value;
  }
  const fromRate = MOCK_RATES[from.toUpperCase()];
  const toRate = MOCK_RATES[to.toUpperCase()];

  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency conversion ${from} → ${to}`);
  }

  const usdValue = value / fromRate;
  return usdValue * toRate;
}
