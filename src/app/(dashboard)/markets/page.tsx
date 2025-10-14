'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEtfFlows, useFundingGamma } from '@/hooks';
import { formatCurrency } from '@/lib/utils/numberFormat';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { useUIStore } from '@/store/ui';
import {
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  Activity,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { VisionGuide, VisionGuideItem } from '@/components/VisionGuide';

// ETF Autoswitch Card as Hero variant
function EtfAutoswitchHero({
  showAssetPicker = false,
}: {
  showAssetPicker?: boolean;
}) {
  const { flows, compare } = useEtfFlows();
  const { data: flowsData, isLoading, error, refetch } = flows;
  const compareData = compare.data as any;
  const [showAssetFilter, setShowAssetFilter] = useState(false);

  if (isLoading) {
    return (
      <Card className="adaf-card relative overflow-hidden" id="etf-hero">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/12 via-amber-400/10 to-sky-500/12" />
        <CardHeader
          className="relative"
          title="ETF Market Overview"
          subtitle="Flujos en vivo y comparación multi-activo"
        />
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SkeletonPatterns.MetricValue />
            <SkeletonPatterns.MetricValue />
            <SkeletonPatterns.MetricValue />
          </div>
          <div className="mt-6">
            <SkeletonPatterns.Table />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="adaf-card relative overflow-hidden" id="etf-hero">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/12 via-amber-500/8 to-sky-500/10" />
        <CardHeader
          className="relative"
          title="ETF Market Overview"
          subtitle="Flujos en vivo y comparación multi-activo"
        />
        <CardContent className="relative p-6">
          <ErrorState title="ETF Market Data Unavailable" onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  // Normalize flows list for UI
  const mxnRate = 17.3; // simple demo conversion
  const flowsList = Array.isArray(flowsData)
    ? flowsData
    : (() => {
        // If we have compare data (BTC/ETH series), synthesize latest entries
        const out: any[] = [];
        const btcSeries = compareData?.BTC || compareData?.btc || [];
        const ethSeries = compareData?.ETH || compareData?.eth || [];
        const lastBtc = btcSeries[btcSeries.length - 1];
        const lastEth = ethSeries[ethSeries.length - 1];
        if (lastBtc) {
          out.push({
            symbol: 'BTC Spot ETF',
            provider: 'Mock',
            date: lastBtc.date,
            flowsUsd: lastBtc.dailyNetInflow ?? lastBtc.flows ?? 0,
            flowsMxn: Math.round(
              (lastBtc.dailyNetInflow ?? lastBtc.flows ?? 0) * mxnRate
            ),
          });
        }
        if (lastEth) {
          out.push({
            symbol: 'ETH Spot ETF',
            provider: 'Mock',
            date: lastEth.date,
            flowsUsd: lastEth.dailyNetInflow ?? lastEth.flows ?? 0,
            flowsMxn: Math.round(
              (lastEth.dailyNetInflow ?? lastEth.flows ?? 0) * mxnRate
            ),
          });
        }
        return out;
      })();

  const topFlows = flowsList.slice(0, 8);
  const totalFlowUsd = topFlows.reduce(
    (sum, etf) => sum + Math.abs(etf.flowsUsd),
    0
  );

  const getFlowIndicator = (flowUsd: number) => {
    if (flowUsd > 0) return { icon: TrendingUp, color: 'text-emerald-300' };
    return { icon: TrendingDown, color: 'text-rose-300' };
  };

  const getFlowSignal = (flowUsd: number): 'BUY' | 'SELL' | null => {
    if (Math.abs(flowUsd) < 1000000) return null; // Less than 1M USD
    return flowUsd > 0 ? 'BUY' : 'SELL';
  };

  // Asset filter functionality
  const handleAssetFilter = () => {
    setShowAssetFilter(!showAssetFilter);
  };

  const handleExportCSV = () => {
    const csvData = topFlows.map(flow => ({
      Symbol: flow.symbol,
      Provider: flow.provider,
      Date: flow.date,
      'Flow USD': flow.flowsUsd,
      'Flow MXN': flow.flowsMxn,
      Signal: getFlowSignal(flow.flowsUsd) || 'NEUTRAL',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute(
      'download',
      `etf-flows-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="adaf-card relative overflow-hidden" id="etf-hero">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/12 via-amber-400/10 to-sky-500/12" />
      <CardHeader
        className="relative"
        title="ETF Market Overview"
        subtitle="Flujos en vivo, señales y comparación multi-activo"
        asOf={flowsData?.[0]?.date}
        actions={
          <div className="flex gap-2">
            {showAssetPicker && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={handleAssetFilter}
              >
                <Filter className="mr-2 h-4 w-4" />
                Asset Filter
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleExportCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <CardContent className="relative p-6 pt-0">
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-amber-200/25 bg-black/45 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">
              Total Flow (24h)
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-100">
              {formatCurrency(totalFlowUsd, 'USD', true)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200/25 bg-black/45 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">
              Active ETFs
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-100">
              {topFlows.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200/25 bg-black/45 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">
              Positive Flows
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-300">
              {topFlows.filter(etf => etf.flowsUsd > 0).length}/
              {topFlows.length}
            </p>
          </div>
        </div>

        <div className="space-y-3" id="etf-flows">
          <div className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/60">
            Top ETF Flows
          </div>

          {topFlows.map((etf: any, index: number) => {
            const { icon: FlowIcon, color } = getFlowIndicator(etf.flowsUsd);
            const signal = getFlowSignal(etf.flowsUsd);

            return (
              <div
                key={`${etf.symbol}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-amber-200/20 bg-black/45 px-4 py-3 transition-all duration-200 hover:border-amber-200/35 hover:bg-amber-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-amber-200/30 bg-amber-500/15 p-2 text-amber-100">
                    <FlowIcon className={cn('h-3.5 w-3.5', color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                      {etf.symbol}
                      {signal && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] tracking-[0.3em]',
                            signal === 'BUY'
                              ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
                              : 'border-rose-400/50 bg-rose-500/15 text-rose-100'
                          )}
                        >
                          {signal}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-amber-100/60">
                      Provider · {etf.provider}
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm">
                  <div className={cn('font-semibold', color)}>
                    {etf.flowsUsd > 0 ? '+' : ''}
                    {formatCurrency(etf.flowsUsd, 'USD', true)}
                  </div>
                  <div className="text-xs text-amber-100/60">
                    MXN: {formatCurrency(etf.flowsMxn, 'MXN', true)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ETF Compare Panel (7D BTC vs ETH)
function EtfComparePanel({
  defaultMode = 'daily',
}: {
  defaultMode?: 'daily' | 'cumulative';
}) {
  const [mode, setMode] = useState<'daily' | 'cumulative'>(defaultMode);
  const { compare } = useEtfFlows();
  const { data: compareData, isLoading } = compare;

  const handleToggleMode = () => {
    setMode(mode === 'daily' ? 'cumulative' : 'daily');
  };

  if (isLoading) {
    return (
      <Card className="adaf-card">
        <CardHeader
          title="BTC vs ETH Comparison (7D)"
          badge={`${mode === 'daily' ? 'Daily' : 'Cumulative'} flow comparison`}
        />
        <CardContent className="p-6">
          <SkeletonPatterns.Table />
        </CardContent>
      </Card>
    );
  }

  // Use compare series directly (BTC/ETH)
  const btcSeries =
    (compareData as any)?.BTC || (compareData as any)?.btc || [];
  const ethSeries =
    (compareData as any)?.ETH || (compareData as any)?.eth || [];
  const toRow = (row: any) => ({
    symbol: row.symbol || '—',
    flowsUsd: row.dailyNetInflow ?? row.flows ?? 0,
  });

  // Calculate flows based on mode
  const calculateFlows = (series: any[]) => {
    const flows = series.slice(-7).map(toRow);
    if (mode === 'cumulative') {
      let cumulative = 0;
      return flows.map(flow => {
        cumulative += flow.flowsUsd;
        return { ...flow, flowsUsd: cumulative };
      });
    }
    return flows;
  };

  const btcFlows = calculateFlows(btcSeries);
  const ethFlows = calculateFlows(ethSeries);

  return (
    <Card className="adaf-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/8 to-sky-500/10" />
      <CardHeader
        className="relative"
        title="BTC vs ETH Comparison (7D)"
        subtitle={`${mode === 'daily' ? 'Daily' : 'Cumulative'} flow comparison`}
        asOf={
          (compareData as any)?.BTC?.[0]?.date ||
          (compareData as any)?.btc?.[0]?.date
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleToggleMode}
          >
            {mode === 'daily' ? 'Show Cumulative' : 'Show Daily'}
          </Button>
        }
      />

      <CardContent className="relative p-6 pt-0">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-200/20 bg-black/45 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-100">
              <BarChart3 className="h-4 w-4 text-amber-200" />
              BTC ETF Flows
            </h4>
            <div className="space-y-2">
              {btcFlows.map((flow: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between rounded-xl border border-amber-200/20 bg-black/40 px-3 py-2 text-sm text-amber-100/80"
                >
                  <span>{flow.symbol}</span>
                  <span
                    className={cn(
                      'font-semibold',
                      flow.flowsUsd > 0 ? 'text-emerald-300' : 'text-rose-300'
                    )}
                  >
                    {formatCurrency(flow.flowsUsd, 'USD', true)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/20 bg-black/45 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Activity className="h-4 w-4 text-amber-200" />
              ETH ETF Flows
            </h4>
            <div className="space-y-2">
              {ethFlows.map((flow: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between rounded-xl border border-amber-200/20 bg-black/40 px-3 py-2 text-sm text-amber-100/80"
                >
                  <span>{flow.symbol}</span>
                  <span
                    className={cn(
                      'font-semibold',
                      flow.flowsUsd > 0 ? 'text-emerald-300' : 'text-rose-300'
                    )}
                  >
                    {formatCurrency(flow.flowsUsd, 'USD', true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Funding Table
function FundingTable({
  asset = 'BTC',
  days = 14,
}: {
  asset?: string;
  days?: number;
}) {
  const { funding } = useFundingGamma();
  const { data: fundingData, isLoading, error } = funding;

  const handleExportFundingCSV = () => {
    try {
      // Try API first
      window.open(
        `/api/read/derivs/funding?asset=${asset}&days=${days}&format=csv`
      );
    } catch (apiError) {
      // Fallback to local CSV generation
      const assetFunding = fundingData?.filter(f => f.asset === asset) || [];
      const csvData = assetFunding.map(funding => ({
        Exchange: funding.exchange,
        Asset: funding.asset,
        Rate: funding.rate,
        Timestamp: funding.timestamp,
        Status: funding.rate < 0 ? 'Negative' : 'Normal',
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute(
        'download',
        `funding-rates-${asset}-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (isLoading) {
    return (
      <Card className="adaf-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/8 to-sky-500/10" />
        <CardHeader
          className="relative"
          title="Funding Rates"
          subtitle={`${asset} funding across exchanges (${days}d)`}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleExportFundingCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          }
        />
        <CardContent className="relative p-6">
          <SkeletonPatterns.Table />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="adaf-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/12 via-amber-500/8 to-sky-500/10" />
        <CardHeader
          className="relative"
          title="Funding Rates"
          subtitle={`${asset} funding across exchanges (${days}d)`}
        />
        <CardContent className="relative p-6">
          <ErrorState title="Funding Data Unavailable" />
        </CardContent>
      </Card>
    );
  }

  const assetFunding = fundingData?.filter(f => f.asset === asset) || [];

  return (
    <Card className="adaf-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/8 to-sky-500/10" />
      <CardHeader
        className="relative"
        title="Funding Rates"
        subtitle={`${asset} funding across exchanges (${days}d)`}
        asOf={assetFunding[0]?.timestamp}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleExportFundingCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <CardContent className="relative p-6 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-amber-100/80">
            <thead>
              <tr className="border-b border-amber-200/20 text-left uppercase tracking-[0.25em] text-amber-200/60">
                <th className="pb-3">Exchange</th>
                <th className="pb-3">Latest</th>
                <th className="pb-3">14D Spark</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {assetFunding
                .sort((a, b) => b.rate - a.rate)
                .map((funding, index) => {
                  const isNegative = funding.rate < 0;
                  const isNeg48h = funding.rate < 0; // Simplified placeholder

                  return (
                    <tr
                      key={index}
                      className="border-b border-amber-200/15 bg-black/40"
                    >
                      <td className="py-3 font-semibold text-amber-100">
                        {funding.exchange}
                      </td>
                      <td
                        className={cn(
                          'py-3 font-mono',
                          isNegative ? 'text-rose-300' : 'text-emerald-300'
                        )}
                      >
                        {(funding.rate * 100).toFixed(4)}%
                      </td>
                      <td className="py-3">
                        <div className="flex h-6 w-16 items-center justify-center rounded-full border border-amber-200/20 bg-black/60 text-xs text-amber-100/70">
                          📈
                        </div>
                      </td>
                      <td className="py-3">
                        {isNegative && isNeg48h ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Neg 48h+
                          </Badge>
                        ) : isNegative ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-rose-200/85"
                          >
                            Negative
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Normal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Markets Page
export default function MarketsPage() {
  const { selectedAssets } = useUIStore();
  const handleScroll = useCallback(
    (selector: string) => () => {
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  const guideItems: VisionGuideItem[] = [
    {
      title: 'Filtrar activos ETF',
      description:
        'Usa el filtro superior para mostrar sólo los activos relevantes.',
      action: {
        type: 'button',
        label: 'Ir al filtro',
        onClick: handleScroll('#etf-hero'),
      },
    },
    {
      title: 'Comparar BTC vs ETH',
      description:
        'Evalúa spreads diarios o acumulados en la sección de comparación.',
      action: { type: 'link', label: 'Ver comparación', href: '#comparison' },
    },
    {
      title: 'Revisar funding rates',
      description:
        'Supervisa exchanges con tasas negativas persistentes y exporta CSV.',
      action: { type: 'link', label: 'Ir a funding', href: '#funding' },
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24">
      <nav className="text-xs uppercase tracking-[0.35em] text-amber-200/60">
        <Link href="/" className="hover:text-amber-100">
          Dashboard
        </Link>
        <span className="mx-2">›</span>
        <span>Markets</span>
      </nav>

      <EtfAutoswitchHero showAssetPicker />

      <section id="comparison" className="scroll-mt-24">
        <EtfComparePanel defaultMode="daily" />
      </section>

      <section id="funding" className="scroll-mt-24">
        <FundingTable asset={selectedAssets[0] ?? 'BTC'} days={14} />
      </section>

      <VisionGuide items={guideItems} />
    </div>
  );
}
