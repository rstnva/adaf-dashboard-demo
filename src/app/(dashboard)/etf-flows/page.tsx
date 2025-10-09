'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEtfFlows } from '@/hooks';
import { formatCurrency } from '@/lib/utils/numberFormat';
import { CardHeader } from '@/components/common/CardHeader';
import { SkeletonPatterns } from '@/components/common/SkeletonBlock';
import { ErrorState } from '@/components/common/ErrorState';
import { 
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function EtfFlowsPage() {
  const { flows } = useEtfFlows();
  const { data: flowsData, isLoading, error, refetch } = flows;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ETF Flows</h1>
            <p className="text-muted-foreground">
              Análisis detallado de flujos ETF en tiempo real
            </p>
          </div>
        </div>

        <Card className="adaf-card">
          <CardHeader title="Cargando flujos ETF..." />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonPatterns.MetricValue />
              <SkeletonPatterns.MetricValue />
              <SkeletonPatterns.MetricValue />
            </div>
            <div className="mt-6">
              <SkeletonPatterns.Table />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ETF Flows</h1>
            <p className="text-muted-foreground">
              Análisis detallado de flujos ETF en tiempo real
            </p>
          </div>
        </div>

        <Card className="adaf-card">
          <CardHeader title="Error al cargar flujos ETF" />
          <CardContent className="p-6">
            <ErrorState
              title="Error al cargar datos"
              error={error}
              onRetry={refetch}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalFlowUsd = flowsData?.reduce((sum, etf) => sum + Math.abs(etf.flowsUsd), 0) || 0;
  const inflowCount = flowsData?.filter(etf => etf.flowsUsd > 0).length || 0;
  const outflowCount = flowsData?.filter(etf => etf.flowsUsd < 0).length || 0;

  const getFlowIndicator = (flowUsd: number) => {
    if (flowUsd > 100_000_000) return { icon: TrendingUp, color: 'text-green-600' };
    if (flowUsd > 0) return { icon: TrendingUp, color: 'text-green-500' };
    if (flowUsd > -100_000_000) return { icon: TrendingDown, color: 'text-red-500' };
    return { icon: TrendingDown, color: 'text-red-600' };
  };

  const getFlowSignal = (flowUsd: number) => {
    if (Math.abs(flowUsd) > 500_000_000) return flowUsd > 0 ? 'STRONG BUY' : 'STRONG SELL';
    if (Math.abs(flowUsd) > 100_000_000) return flowUsd > 0 ? 'BUY' : 'SELL';
    return null;
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ETF Flows</h1>
            <p className="text-muted-foreground">
              Análisis detallado de flujos ETF en tiempo real
            </p>
          </div>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="adaf-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flujo Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalFlowUsd, 'USD', true)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="adaf-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inflows</p>
                <p className="text-2xl font-bold text-green-600">
                  {inflowCount} ETFs
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="adaf-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outflows</p>
                <p className="text-2xl font-bold text-red-600">
                  {outflowCount} ETFs
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETF Flows Table */}
      <Card className="adaf-card">
        <CardHeader 
          title="Flujos ETF Detallados"
          badge={`${flowsData?.length || 0} ETFs`}
        />
        <CardContent className="p-6">
          <div className="space-y-4">
            {flowsData?.map((etf, index) => {
              const { icon: FlowIcon, color } = getFlowIndicator(etf.flowsUsd);
              const signal = getFlowSignal(etf.flowsUsd);
              
              return (
                <div 
                  key={`${etf.symbol}-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FlowIcon className={cn("h-5 w-5", color)} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{etf.symbol}</span>
                        {signal && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              signal.includes('BUY') ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200'
                            )}
                          >
                            {signal}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {etf.provider} • Crypto ETF
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn("text-lg font-bold", color)}>
                      {etf.flowsUsd > 0 ? '+' : ''}{formatCurrency(etf.flowsUsd, 'USD', true)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      MXN: {formatCurrency(etf.flowsMxn, 'MXN', true)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}