import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { incApiRequest, setOpxBacklog } from '@/lib/metrics';

const prisma = new PrismaClient();

type OpxMeta = {
  risks?: string[];
  sizing?: { notionalPctNAV?: number; maxDDbps?: number };
  agentCode?: string;
  agentBucket?: string;
  asset?: string;
  var?: number;
};
type OpxRow = {
  id: string;
  signalId: string | null;
  createdAt: Date;
  title: string;
  description: string;
  metadata: OpxMeta | null;
  status: string;
  type: string;
  agent_code: string | null;
};

type LimitsRuntime = {
  ltv: number;
  hf: number;
  slippage: number;
  realyield: number;
};

function computeBlocking(
  meta: OpxMeta | null | undefined,
  rt: LimitsRuntime
): string[] {
  const out: string[] = [];
  const sizing = meta?.sizing || {};
  // Simple heuristics per spec
  if ((sizing.notionalPctNAV ?? 0) > 35) out.push('LTV');
  if (rt.hf < 1.6) out.push('HF');
  if (rt.slippage > 0.5) out.push('Slippage');
  if (rt.realyield < 0.6) out.push('RealYield');
  return Array.from(new Set(out));
}

function getMockOpportunities() {
  const base = [
    {
      id: 'mock-1',
      createdAt: new Date().toISOString(),
      agentCode: 'OPX-A1',
      idea: 'BTC Spot Accumulation',
      thesis: 'Flujos institucionales favorecen acumulación en spot ETFs.',
      risks: ['Volatilidad BTC', 'Regulación'],
      sizing: { notionalPctNAV: 12, maxDDbps: 180 },
      var: 42000,
      type: 'beta' as const,
      status: 'proposed' as const,
      score: 74,
      consensus: 0.62,
      blocking: [],
    },
    {
      id: 'mock-2',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      agentCode: 'OPX-B7',
      idea: 'ETH Basis Trade',
      thesis: 'Contango moderado y funding positivo abren spread neutral.',
      risks: ['Latencia ejecuciones', 'Counterparty'],
      sizing: { notionalPctNAV: 9, maxDDbps: 120 },
      var: 25000,
      type: 'basis' as const,
      status: 'approved' as const,
      score: 82,
      consensus: 0.78,
      blocking: [],
    },
    {
      id: 'mock-3',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      agentCode: 'OPX-R3',
      idea: 'Real Yield Vault Rotation',
      thesis: 'Aumenta rendimiento en stablecoins mediante vaults RWAs.',
      risks: ['Riesgo emisor', 'Liquidaciones'],
      sizing: { notionalPctNAV: 20, maxDDbps: 300 },
      var: 60000,
      type: 'realYield' as const,
      status: 'proposed' as const,
      score: 68,
      consensus: 0.55,
      blocking: ['LTV'],
    },
    {
      id: 'mock-4',
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
      agentCode: 'OPX-ARB2',
      idea: 'Delta-Neutral Basis Arb',
      thesis: 'Spread entre futuros trimestrales y spot permanece elevado.',
      risks: ['Funding flip', 'Slippage'],
      sizing: { notionalPctNAV: 6, maxDDbps: 80 },
      var: 18000,
      type: 'arb' as const,
      status: 'rejected' as const,
      score: 58,
      consensus: 0.4,
      blocking: [],
    },
  ];
  return base;
}

function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b);
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const statusParam = (
    u.searchParams.get('status') || 'proposed'
  ).toLowerCase();
  const typeParam = (u.searchParams.get('type') || 'any').toLowerCase();
  const q = u.searchParams.get('q') || '';
  const limitReq = Number(u.searchParams.get('limit') || 100);
  const pageReq = Number(u.searchParams.get('page') || 1);
  const orderParam = (u.searchParams.get('order') || 'score').toLowerCase();
  const dirParam = (u.searchParams.get('dir') || 'desc').toLowerCase();

  // validate and normalize params
  const status = ['proposed', 'approved', 'rejected', 'any'].includes(
    statusParam
  )
    ? statusParam
    : 'proposed';
  const type = ['beta', 'basis', 'realyield', 'arb', 'any'].includes(typeParam)
    ? typeParam
    : 'any';
  const order = ['score', 'var', 'createdat'].includes(orderParam)
    ? orderParam
    : 'score';
  const dir = ['asc', 'desc'].includes(dirParam) ? dirParam : 'desc';
  const limit = clamp(limitReq, 1, 500);
  const page = Math.max(1, pageReq);
  const skip = (page - 1) * limit;

  // Serve mock data immediately when running in MOCK_MODE
  if (process.env.MOCK_MODE === '1') {
    const mock = getMockOpportunities()
      .filter(item => status === 'any' || item.status === status)
      .filter(item => type === 'any' || item.type.toLowerCase() === type)
      .filter(
        item =>
          q === '' ||
          item.idea.toLowerCase().includes(q.toLowerCase()) ||
          item.thesis.toLowerCase().includes(q.toLowerCase())
      );

    const dirMulMock = dir === 'asc' ? 1 : -1;
    const orderKeyMock =
      order === 'var' ? 'var' : order === 'createdat' ? 'createdAt' : 'score';
    const sortedMock = mock.sort((a, b) => {
      const av =
        orderKeyMock === 'createdAt'
          ? new Date(a.createdAt).getTime()
          : (a as any)[orderKeyMock];
      const bv =
        orderKeyMock === 'createdAt'
          ? new Date(b.createdAt).getTime()
          : (b as any)[orderKeyMock];
      if (av === bv) return 0;
      return av < bv ? -1 * dirMulMock : 1 * dirMulMock;
    });

    const totalMock = sortedMock.length;
    const pagesMock = Math.max(1, Math.ceil(totalMock / limit));
    const paginated = sortedMock.slice(skip, skip + limit);

    const res = NextResponse.json({
      page,
      pages: pagesMock,
      limit,
      total: totalMock,
      data: paginated,
    });
    incApiRequest('/api/read/opx/list', 'GET', res.status);
    return res;
  }

  try {
    // Limits/runtime metrics (latest)
    const m = await prisma.$queryRaw<
      Array<{ key: string; value: number }>
    >(Prisma.sql`
      SELECT key, (value)::float8 AS value
      FROM metrics
      WHERE key IN ('ltv.current','hf.current','slippage.current','realyield.current')
      ORDER BY ts DESC
      LIMIT 4
    `);
    const rt: LimitsRuntime = {
      ltv: Number(m.find(x => x.key === 'ltv.current')?.value ?? 0),
      hf: Number(m.find(x => x.key === 'hf.current')?.value ?? 0),
      slippage: Number(m.find(x => x.key === 'slippage.current')?.value ?? 0),
      realyield: Number(m.find(x => x.key === 'realyield.current')?.value ?? 0),
    };

    // Count for backlog gauge per status
    const counts = await prisma.$queryRaw<
      Array<{ status: string; c: number }>
    >(Prisma.sql`
      SELECT status, COUNT(*)::int AS c FROM opportunities GROUP BY status
    `);
    for (const c of counts) {
      const s = (c.status || '').toLowerCase() as
        | 'proposed'
        | 'approved'
        | 'rejected';
      if (s === 'proposed' || s === 'approved' || s === 'rejected')
        setOpxBacklog(s, Number(c.c || 0));
    }

    // Filters
    const rows = await prisma.$queryRaw<OpxRow[]>(Prisma.sql`
      SELECT id, signalId, type, status, title, description, metadata, "createdAt" as "createdAt",
             COALESCE(metadata->>'agentCode', NULL) AS agent_code
      FROM opportunities
      WHERE (${status} = 'any' OR lower(status) = ${status})
        AND (${type} = 'any' OR lower(type) = ${type})
        AND (${q} = '' OR (title ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'}))
      ORDER BY createdAt DESC
      OFFSET ${Prisma.raw(String(skip))}
      LIMIT ${Prisma.raw(String(limit))}
    `);

    // Derive score/consensus/blocking to match exact response shape
    type OpxListItem = {
      id: string;
      createdAt: string;
      agentCode: string;
      idea: string;
      thesis: string;
      risks: string[];
      sizing: { notionalPctNAV: number; maxDDbps?: number };
      var: number;
      type: 'beta' | 'basis' | 'realYield' | 'arb';
      status: 'proposed' | 'approved' | 'rejected';
      score: number;
      consensus: number;
      blocking: string[];
    };
    const data: OpxListItem[] = [];
    for (const r of rows) {
      const meta: OpxMeta | null = r.metadata as OpxMeta | null;
      const blocking = computeBlocking(meta, rt);
      // Simple consensus: count last 7 days same agent bucket in signals as favorable/in-contra via metadata mapping; here stubbed as 0..1 using random-ish heuristic from metadata
      let consensus = 0;
      try {
        const asset = meta?.asset || '';
        const bucket = meta?.agentBucket || '';
        const since = Prisma.sql`(now() - interval '7 days')`;
        const consRows = await prisma.$queryRaw<
          Array<{ src: string; dir: number }>
        >(Prisma.sql`
          SELECT source AS src,
                 CASE WHEN (metadata->>'direction') IN ('pro','bull','positive') THEN 1
                      WHEN (metadata->>'direction') IN ('con','bear','negative') THEN -1
                      ELSE 0 END AS dir
          FROM signals
          WHERE (metadata->>'asset') = ${asset}
            AND (metadata->>'bucket') = ${bucket}
            AND timestamp >= ${since}
        `);
        const pos = consRows.filter(x => x.dir > 0).length;
        const neg = consRows.filter(x => x.dir < 0).length;
        consensus = pos + neg > 0 ? pos / (pos + neg) : 0;
        const distinctSources = new Set(
          consRows.filter(x => x.dir > 0).map(x => x.src)
        ).size;
        if (distinctSources >= 3) consensus = Math.min(1, consensus + 0.1);
      } catch (error) {
        console.warn('Unable to compute OP-X consensus window', { error });
      }

      // Score: base by severity if available on linked signal (fallback 50)
      let base = 50;
      try {
        const [sevRow] = await prisma.$queryRaw<
          Array<{ sev: string }>
        >(Prisma.sql`
          SELECT lower(s.severity) AS sev FROM signals s
          WHERE s.id = ${r.signalId}
          LIMIT 1
        `);
        base =
          sevRow?.sev === 'high'
            ? 70
            : sevRow?.sev === 'medium'
              ? 50
              : sevRow?.sev === 'low'
                ? 30
                : 50;
      } catch (error) {
        console.warn('Unable to fetch signal severity for OP-X scoring', {
          error,
          signalId: r.signalId,
        });
      }

      const adj = consensus >= 0.66 ? 20 : consensus >= 0.33 ? 10 : 0;
      const guardrailPenalty = 20 * blocking.length;
      // Var penalty vs NAV
      let nav = 0;
      try {
        const [navRow] = await prisma.$queryRaw<Array<{ v: number }>>(
          Prisma.sql`SELECT (value)::float8 AS v FROM metrics WHERE key='nav.usd' ORDER BY ts DESC LIMIT 1`
        );
        nav = Number(navRow?.v || 0);
      } catch (error) {
        console.warn('Unable to read NAV metric for OP-X scoring', { error });
      }
      const varValue = Number(meta?.var ?? 0);
      const varPct = nav > 0 ? varValue / nav : 0;
      const varPenalty = varPct > 0.05 ? 20 : varPct > 0.03 ? 10 : 0;
      const score = clamp(base + adj - guardrailPenalty - varPenalty, 0, 100);

      // normalize types with fallbacks
      const normType = (r.type || '').toLowerCase();
      const validType: 'beta' | 'basis' | 'realYield' | 'arb' =
        normType === 'beta'
          ? 'beta'
          : normType === 'basis'
            ? 'basis'
            : normType === 'realyield' || normType === 'realYield'
              ? 'realYield'
              : normType === 'arb'
                ? 'arb'
                : 'beta';

      const normStatus = (r.status || '').toLowerCase();
      const validStatus: 'proposed' | 'approved' | 'rejected' =
        normStatus === 'proposed'
          ? 'proposed'
          : normStatus === 'approved'
            ? 'approved'
            : normStatus === 'rejected'
              ? 'rejected'
              : 'proposed';

      data.push({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        agentCode: meta?.agentCode ?? r.agent_code ?? '',
        idea: r.title ?? '',
        thesis: r.description ?? '',
        risks: meta?.risks ?? [],
        sizing: {
          notionalPctNAV: meta?.sizing?.notionalPctNAV ?? 0,
          maxDDbps: meta?.sizing?.maxDDbps,
        },
        var: varValue,
        type: validType,
        status: validStatus,
        score,
        consensus,
        blocking,
      });
    }

    // total for pagination
    const [{ c: total }] = await prisma.$queryRaw<
      Array<{ c: number }>
    >(Prisma.sql`
      SELECT COUNT(*)::int AS c FROM opportunities
      WHERE (${status} = 'any' OR lower(status) = ${status})
        AND (${type} = 'any' OR lower(type) = ${type})
        AND (${q} = '' OR (title ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'}))
    `);
    const pages = Math.max(1, Math.ceil(Number(total) / limit));

    // ordering by derived fields (score) client-side here
    const dirMul = dir === 'asc' ? 1 : -1;
    const orderKey =
      order === 'var' ? 'var' : order === 'createdat' ? 'createdAt' : 'score';
    const sorted = [...data].sort((a, b) =>
      a[orderKey] < b[orderKey]
        ? -1 * dirMul
        : a[orderKey] > b[orderKey]
          ? 1 * dirMul
          : 0
    );

    const res = NextResponse.json({
      page,
      pages,
      limit,
      total: Number(total),
      data: sorted,
    });
    incApiRequest('/api/read/opx/list', 'GET', res.status);
    return res;
  } catch (e: unknown) {
    // Fallback with mock data when database is not available
    if (
      e instanceof Error &&
      (e.message.includes("Can't reach database server") ||
        e.message.includes('PrismaClientInitializationError'))
    ) {
      const mockData = [
        {
          id: 'mock-1',
          createdAt: new Date().toISOString(),
          agentCode: 'DEMO-001',
          idea: 'BTC Long Position via ETF',
          thesis:
            'Strong institutional demand and favorable regulatory environment suggests upside potential',
          risks: ['Market volatility', 'Regulatory changes'],
          sizing: { notionalPctNAV: 15, maxDDbps: 200 },
          var: 50000,
          type: 'beta' as const,
          status: 'proposed' as const,
          score: 75,
          consensus: 0.65,
          blocking: [],
        },
        {
          id: 'mock-2',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          agentCode: 'DEMO-002',
          idea: 'ETH Basis Trade',
          thesis:
            'Positive funding rates and contango structure present arbitrage opportunity',
          risks: ['Execution risk', 'Counterparty risk'],
          sizing: { notionalPctNAV: 8, maxDDbps: 100 },
          var: 25000,
          type: 'basis' as const,
          status: 'approved' as const,
          score: 85,
          consensus: 0.8,
          blocking: [],
        },
      ];

      const res = NextResponse.json({
        page: 1,
        pages: 1,
        limit: 50,
        total: mockData.length,
        data: mockData,
      });
      incApiRequest('/api/read/opx/list', 'GET', res.status);
      return res;
    }

    const res = NextResponse.json(
      { error: e instanceof Error ? e.message : 'internal error' },
      { status: 500 }
    );
    incApiRequest('/api/read/opx/list', 'GET', res.status);
    return res;
  }
}
