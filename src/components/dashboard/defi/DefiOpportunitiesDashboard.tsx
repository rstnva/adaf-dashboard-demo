'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, ShieldCheck, AlertTriangle, LinkIcon, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { useDefiOpportunities } from '@/lib/api/useDefiOpportunities';
import type { DefiOpportunity } from '@/lib/defi/types';
import { cn } from '@/lib/utils';

const POPULAR_CHAINS = ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon', 'Solana'];

const POPULAR_PROTOCOLS = ['Gearbox', 'Aave', 'SummerFi', 'EigenLayer', 'Lido', 'Pendle'];

type ChainFilter = typeof POPULAR_CHAINS[number] | 'All';

type ProtocolFilter = typeof POPULAR_PROTOCOLS[number] | 'All';

export function DefiOpportunitiesDashboard() {
  const [search, setSearch] = useState('');
  const [chain, setChain] = useState<ChainFilter>('All');
  const [protocol, setProtocol] = useState<ProtocolFilter>('All');
  const [minApy, setMinApy] = useState<number>(0);
  const [stablecoinOnly, setStablecoinOnly] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useDefiOpportunities({
    search,
    chains: chain !== 'All' ? [chain] : undefined,
    protocols: protocol !== 'All' ? [protocol] : undefined,
    minApy,
    stablecoinOnly,
  });

  const metrics = useMemo(() => {
    if (!data) {
      return {
        highestApy: 0,
        totalTvl: 0,
        count: 0,
        lowRiskShare: 0,
      };
    }

    const count = data.opportunities.length;
    const highestApy = data.opportunities[0]?.apy ?? 0;
    const totalTvl = data.opportunities.reduce((acc, item) => acc + item.tvlUsd, 0);
    const lowRisk = data.opportunities.filter((item) => item.riskLevel === 'low').length;

    return {
      count,
      highestApy,
      totalTvl,
      lowRiskShare: count > 0 ? (lowRisk / count) * 100 : 0,
    };
  }, [data]);

  const formatUsd = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value >= 1_000_000 ? 'compact' : 'standard',
      maximumFractionDigits: 2,
    }).format(value);

  const formatPercent = (value: number | null) =>
    value === null || value === undefined ? '—' : `${value.toFixed(2)}%`;

  const renderRiskBadge = (opportunity: DefiOpportunity) => {
    const map: Record<DefiOpportunity['riskLevel'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      low: { label: 'Low', variant: 'secondary' },
      medium: { label: 'Medium', variant: 'default' },
      high: { label: 'High', variant: 'destructive' },
      unknown: { label: 'Unknown', variant: 'outline' },
    };

    const config = map[opportunity.riskLevel];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader>
          <CardTitle>DeFi Yield Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonPatterns.Table />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="adaf-card">
        <CardHeader>
          <CardTitle>DeFi Yield Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            variant="default"
            error={error instanceof Error ? error : new Error('Unable to load DeFi opportunities')}
            onRetry={() => {
              void refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">DeFi Yield Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento en tiempo real de oportunidades DeFi en Gearbox, SummerFi, Aave, EigenLayer y todo el universo multichain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oportunidades activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{metrics.count.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Criterios filtrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mayor APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{formatPercent(metrics.highestApy)}</div>
            <p className="text-xs text-muted-foreground">Último minuto</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TVL agregado</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{formatUsd(metrics.totalTvl)}</div>
            <p className="text-xs text-muted-foreground">Across filtered opportunities</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participación low risk</CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{formatPercent(metrics.lowRiskShare)}</div>
            <p className="text-xs text-muted-foreground">Basado en score de auditoría e IL</p>
          </CardContent>
        </Card>
      </div>

      <Card className="adaf-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Buscar protocolo / chain / token</label>
            <Input
              placeholder="Ej. Gearbox, ETH, SummerFi"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Chain</label>
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
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Protocol</label>
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
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">APY mínima</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.1}
                value={minApy}
                onChange={(event) => setMinApy(Number(event.target.value))}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button
              size="sm"
              variant={stablecoinOnly ? 'default' : 'outline'}
              onClick={() => setStablecoinOnly((prev) => !prev)}
              className="w-full"
            >
              Stablecoins
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="adaf-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Oportunidades en tiempo real</CardTitle>
          <div className="text-xs text-muted-foreground">
            Última actualización: {data ? new Date(data.updatedAt).toLocaleTimeString() : '—'}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>Base / Rewards</TableHead>
                <TableHead>APY Δ</TableHead>
                <TableHead>TVL</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.opportunities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{item.protocol}</span>
                      {item.details && (
                        <span className="text-xs text-muted-foreground">{item.details}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.chain}</Badge>
                  </TableCell>
                  <TableCell>{item.symbol}</TableCell>
                  <TableCell className="font-semibold text-emerald-400">{formatPercent(item.apy)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>Base: {formatPercent(item.apyBase)}</span>
                      <span>Rewards: {formatPercent(item.apyReward)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>1D: {formatPercent(item.apy1d)}</span>
                      <span>7D: {formatPercent(item.apy7d)}</span>
                      <span>30D: {formatPercent(item.apy30d)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatUsd(item.tvlUsd)}</TableCell>
                  <TableCell>{renderRiskBadge(item)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {item.category.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.url ? (
                      <Button asChild size="sm" variant="outline" className="flex items-center gap-2">
                        <a href={item.url} target="_blank" rel="noreferrer noopener">
                          <LinkIcon className="h-4 w-4" />
                          Abrir
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && data.opportunities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <AlertTriangle className="mb-2 h-6 w-6" />
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm">Ajusta los filtros para visualizar oportunidades.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
