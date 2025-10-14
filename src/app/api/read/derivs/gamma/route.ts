import { NextRequest, NextResponse } from 'next/server';

type GammaPoint = {
  strike: number;
  gamma: number;
};

type GammaResponse = {
  tenor7: GammaPoint[];
  tenor14: GammaPoint[];
  tenor30: GammaPoint[];
};

const generateGammaPoints = (
  asset: 'BTC' | 'ETH',
  tenor: string,
  basePrice: number
): GammaPoint[] => {
  const points: GammaPoint[] = [];
  const multiplier = tenor === '7d' ? 1.0 : tenor === '14d' ? 0.8 : 0.6;

  for (let i = -10; i <= 10; i++) {
    const strike = Math.round(basePrice * (1 + i * 0.05));
    const distance = Math.abs(strike - basePrice) / basePrice;

    const maxGamma = asset === 'BTC' ? 0.005 : 0.008;
    const gamma = maxGamma * multiplier * Math.exp(-Math.pow(distance * 4, 2));

    points.push({
      strike,
      gamma: Number(gamma.toFixed(6)),
    });
  }

  return points.sort((a, b) => a.strike - b.strike);
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assetParam = url.searchParams.get('asset') || 'BTC';

    const asset = ['BTC', 'ETH'].includes(assetParam.toUpperCase())
      ? (assetParam.toUpperCase() as 'BTC' | 'ETH')
      : 'BTC';
    const basePrice = asset === 'BTC' ? 67_000 : 2_450;

    const data: GammaResponse = {
      tenor7: generateGammaPoints(asset, '7d', basePrice),
      tenor14: generateGammaPoints(asset, '14d', basePrice),
      tenor30: generateGammaPoints(asset, '30d', basePrice),
    };

    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'internal error' },
      { status: 500 }
    );
  }
}
