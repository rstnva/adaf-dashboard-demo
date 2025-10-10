import { NextRequest, NextResponse } from 'next/server';
import { DeFiLlamaAdapter } from '@/lib/ingest/adapters/defillama';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { protocol, includeChains } = body;
    if (!protocol) {
      return NextResponse.json({ success: false, error: 'Missing protocol' }, { status: 400 });
    }
    const adapter = new DeFiLlamaAdapter();
    const tvlData = await adapter.getProtocolTVL(protocol);
    let chainData = tvlData.map((point) => point.chain);
    if (includeChains && Array.isArray(includeChains)) {
      chainData = tvlData.filter((point) => includeChains.includes(point.chain)).map((point) => point.chain);
    }
    return NextResponse.json({ protocol, tvlData, chainData }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
};
