import { NextRequest, NextResponse } from 'next/server';

const generateMockFlowData = (asset: string, days: number) => {
  const data: Array<{
    date: string;
    dailyNetInflow: number;
    cumNetInflow: number;
  }> = [];
  let cumulative = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const baseFlow = asset === 'BTC' ? 50_000_000 : 25_000_000;
    const variation = (Math.random() - 0.5) * 0.8;
    const dailyFlow = Math.round(baseFlow * (1 + variation));

    cumulative += dailyFlow;

    data.push({
      date: dateStr,
      dailyNetInflow: dailyFlow,
      cumNetInflow: cumulative,
    });
  }

  return data;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') || '7D';

    const rangeToDays: Record<string, number> = {
      '1D': 1,
      '7D': 7,
      '30D': 30,
      '90D': 90,
    };
    const days = rangeToDays[rangeParam] || 7;

    const out = {
      BTC: generateMockFlowData('BTC', days),
      ETH: generateMockFlowData('ETH', days),
    };

    return NextResponse.json(out);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
