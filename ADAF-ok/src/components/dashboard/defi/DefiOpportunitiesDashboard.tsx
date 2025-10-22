'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, Shield, RefreshCw, Link as LinkIcon, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDefiOpportunities } from '@/lib/api/useDefiOpportunities';
import type { DefiOpportunity } from '@/lib/defi/types';
import { cn } from '@/lib/utils';

const POPULAR_CHAINS = ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon', 'Solana'] as const;
const POPULAR_PROTOCOLS = ['Gearbox', 'Aave', 'SummerFi', 'EigenLayer', 'Lido', 'Pendle'] as const;

type ChainFilter = (typeof POPULAR_CHAINS)[number] | 'All';
type ProtocolFilter = (typeof POPULAR_PROTOCOLS)[number] | 'All';

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value.toFixed(2)}%`;

const riskBadgeClass: Record<DefiOpportunity['riskLevel'], string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-800',
  unknown: 'bg-slate-100 text-slate-600',
};

export function DefiOpportunitiesDashboard() {
  const [search, setSearch] = useState('');
  const [chain, setChain] = useState<ChainFilter>('All');
  const [protocol, setProtocol] = useState<ProtocolFilter>('All');
  const [minApy, setMinApy] = useState<number>(0);
  const [stablecoinOnly, setStablecoinOnly] = useState(false);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      chains: chain !== 'All' ? [chain] : undefined,
      protocols: protocol !== 'All' ? [protocol] : undefined,
      minApy: minApy > 0 ? minApy : undefined,
      stablecoinOnly,
    }),
    [search, chain, protocol, minApy, stablecoinOnly]
  );

  const { data, isLoading, error, refetch, isRefetching } = useDefiOpportunities(queryParams);

  const metrics = useMemo(() => {
    if (!data?.opportunities?.length) {
      return {
        count: 0,
        highestApy: 0,
        totalTvl: 0,
        lowRiskShare: 0,
      };
    }

    const count = data.opportunities.length;
    const highestApy = data.opportunities[0]?.apy ?? 0;
  const totalTvl = data.opportunities.reduce((acc: number, item: DefiOpportunity) => acc + item.tvlUsd, 0);
  const lowRisk = data.opportunities.filter((item: DefiOpportunity) => item.riskLevel === 'low').length;

    return {
      count,
      highestApy,
      totalTvl,
      lowRiskShare: count > 0 ? (lowRisk / count) * 100 : 0,
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">DeFi Yield Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Yields en tiempo real de Gearbox, SummerFi, Aave, EigenLayer y el universo multichain.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Oportunidades activas</CardTitle>
              <CardDescription>Filtradas según tus criterios</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.count.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Mayor APY</CardTitle>
              <CardDescription>Última actualización</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-600">{formatPercent(metrics.highestApy)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">TVL agregado</CardTitle>
              <CardDescription>Liquidez bajo gestión</CardDescription>
            </div>
            <Shield className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatUsd(metrics.totalTvl)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Participación low risk</CardTitle>
              <CardDescription>Basado en auditoría e IL</CardDescription>
            </div>
            <Shield className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-purple-600">{formatPercent(metrics.lowRiskShare)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refina el universo de oportunidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Buscar protocolo / token / cadena</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Ej. Gearbox, SummerFi, USDC"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-muted-foreground">Chain</label>
              <div className="flex flex-wrap gap-2">
                {(['All', ...POPULAR_CHAINS] as ChainFilter[]).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={chain === item ? 'default' : 'outline'}
                    onClick={() => setChain(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-muted-foreground">Protocolo</label>
              <div className="flex flex-wrap gap-2">
                {(['All', ...POPULAR_PROTOCOLS] as ProtocolFilter[]).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={protocol === item ? 'default' : 'outline'}
                    onClick={() => setProtocol(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="text-xs uppercase text-muted-foreground">APY mínima</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={minApy}
                onChange={(event) => setMinApy(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <Button
              variant={stablecoinOnly ? 'default' : 'outline'}
              onClick={() => setStablecoinOnly((prev) => !prev)}
            >
              Stablecoins únicamente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Oportunidades en tiempo real</CardTitle>
            <CardDescription>
              Última actualización: {data ? new Date(data.updatedAt).toLocaleTimeString() : '—'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="font-medium">No pudimos cargar las oportunidades DeFi.</p>
              <Button size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : data?.opportunities?.length ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Protocolo</th>
                  <th className="px-4 py-3">Chain</th>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">APY</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Rewards</th>
                  <th className="px-4 py-3">TVL</th>
                  <th className="px-4 py-3">Riesgo</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.opportunities.map((item: DefiOpportunity) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.protocol}</div>
                      {item.details && (
                        <div className="text-xs text-muted-foreground">{item.details}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{item.chain}</Badge>
                    </td>
                    <td className="px-4 py-3">{item.symbol}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{formatPercent(item.apy)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatPercent(item.apyBase)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatPercent(item.apyReward)}</td>
                    <td className="px-4 py-3">{formatUsd(item.tvlUsd)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-1 text-xs font-medium', riskBadgeClass[item.riskLevel])}>
                        {item.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {item.category.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Abrir
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-6 w-6" />
              <p className="font-medium">Sin resultados para los filtros seleccionados.</p>
              <p>Ajusta los parámetros para descubrir nuevas oportunidades.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
