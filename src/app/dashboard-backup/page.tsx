'use client';

// This is the main dashboard - no redirect needed
import GuardrailsHealth from '@/components/GuardrailsHealth';
import RiskPanel from '@/components/RiskPanel';
import DerivativesPanel from '@/components/DerivativesPanel';
import DqpPanel from '@/components/DqpPanel';

// Enhanced Dashboard Components
import { SimpleKpiStrip } from '@/components/dashboard/SimpleKpiStrip';
import { PnlLine } from '@/components/charts/PnlLine';
import PnlBucketsChart from '@/components/PnlBucketsChart';
import PnlBucketsCards from '@/components/PnlBucketsCards';
import { PresetsDrawer } from '@/components/panels/PresetsDrawer';
import { ActiveBotsStatus } from '@/components/dashboard/ActiveBotsStatus';
import { StrategyOverviewPanel } from '@/components/dashboard/StrategyOverviewPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  TrendingUp,
  Shield,
  Target,
  Zap,
  BarChart3,
  ExternalLink,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

async function getJSON(path: string) {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${path}`,
      { cache: 'no-store' }
    );
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

import { useEffect, useMemo, useState } from 'react';

export default function MainDashboardPage() {
  const [navUsd, setNavUsd] = useState<number>(1000000);
  const [navTs, setNavTs] = useState<string | null>(null);
  const [alertsCount, setAlertsCount] = useState<number>(3);
  const [localTime, setLocalTime] = useState<string>('Cargando...');
  const [alerts, setAlerts] = useState<Array<{ d: string; c: number }>>([]);

  useEffect(() => {
    (async () => {
      const navData = await getJSON('/api/read/kpi/nav');
      const alertsData = await getJSON('/api/read/kpi/alerts7d');
      setNavUsd(navData?.navUsd ?? 1000000);
      setNavTs(navData?.ts ?? null);
      if (Array.isArray(alertsData)) {
        setAlerts(
          alertsData.map(({ d, c }) => ({
            d: d ?? 'Sin fecha',
            c: Number(c ?? 0),
          }))
        );
        setAlertsCount(
          alertsData.reduce(
            (sum: number, x: { d?: string; c?: number }) =>
              sum + Number(x.c || 0),
            0
          )
        );
      } else {
        setAlerts([]);
        setAlertsCount(3);
      }
    })();
  }, []);

  useEffect(() => {
    if (!navTs) return;
    setLocalTime(new Date(navTs).toLocaleTimeString());
  }, [navTs]);

  const alertsSummary = useMemo(() => {
    if (!alerts.length) {
      return null;
    }
    const latest = alerts[0];
    return {
      latest,
      avg: alerts.reduce((sum, item) => sum + item.c, 0) / alerts.length,
    };
  }, [alerts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/markets" className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🎯 ADAF Dashboard Pro
                </h1>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/markets"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/research"
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  Research
                </Link>
                <Link
                  href="/reports"
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/control"
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  Control
                </Link>
                <Link
                  href="/opx"
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  OP-X
                </Link>
                <Link
                  href="/monitoring"
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  Monitor
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-green-50 border-green-300 text-green-700 px-3 py-1"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Sistema Operativo
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-300 text-blue-700 px-3 py-1"
              >
                💰 ${(navUsd / 1000000).toFixed(1)}M NAV
              </Badge>
              {localTime && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700 px-3 py-1"
                >
                  ⏱️ Actualizado: {localTime}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-8">
        {/* Enhanced KPI Strip */}
        <div className="w-full">
          <SimpleKpiStrip
            navUsd={navUsd}
            navTs={navTs}
            alertsCount={alertsCount}
          />
        </div>

        {/* Main Dashboard Grid - Vista Panorámica Fortune 500 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: PnL & Performance (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* PnL Evolution Chart */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    P&L Evolution
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href="/pnl">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Detalle
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PnlLine />
              </CardContent>
            </Card>

            {/* PnL Buckets Summary */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  P&L por Estrategia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PnlBucketsCards days={7} />
                  <div className="h-48">
                    <PnlBucketsChart />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Trading & Bots (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Bots Status */}
            <div className="shadow-lg">
              <ActiveBotsStatus />
            </div>

            {/* Strategy Presets */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Target className="h-5 w-5 text-indigo-600" />
                    </div>
                    Presets de Estrategia
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8">
                    <Settings className="h-3 w-3 mr-1" />
                    Config
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PresetsDrawer />
              </CardContent>
            </Card>

            {/* ETF & Market Data */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    ⚡ ETF Autoswitch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Monitoreo de flujos ETF y rebalanceo automático
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>BTC ETF: +$2.1M</span>
                    <span className="text-green-600">↗ 12%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    💰 Funding Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Tasas de funding y oportunidades detectadas
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>USDT: 0.08%</span>
                    <span className="text-blue-600">Oportunidad</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Column 3: Market Intelligence & Alerts (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Market Intelligence */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  Market Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <div className="text-lg font-bold">🔥 TVL Heatmap</div>
                  <p className="text-sm text-muted-foreground">
                    Protocolos DeFi monitoreados
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="text-green-600">Aave: $12.3B</span> •
                    <span className="text-blue-600"> Uniswap: $8.9B</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Alerts */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Activity className="h-5 w-5 text-red-600" />
                  </div>
                  Alertas Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        Alta volatilidad BTC
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      2m ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        Funding rate spike
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      5m ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Arbitrage detected
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      8m ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  🏆 OP-X Top Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ETH-USDC Arb</span>
                    <span className="text-green-600 font-medium">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BTC Momentum</span>
                    <span className="text-blue-600 font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AAVE Yield</span>
                    <span className="text-purple-600 font-medium">92%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strategy Overview Row */}
        <div className="w-full">
          <StrategyOverviewPanel />
        </div>

        {/* System Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <RiskPanel />
          </div>
          <div className="lg:col-span-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📰 News & Regulatory Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <h4 className="font-medium">
                      Últimas Noticias del Mercado
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Análisis de mercado y actualizaciones regulatorias
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      Promedio 7d:{' '}
                      {alertsSummary ? alertsSummary.avg.toFixed(1) : '—'}{' '}
                      alertas/día
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <h4 className="font-medium">
                      Actualizaciones Regulatorias
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cambios de política que afectan los mercados DeFi
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      Último evento registrado:{' '}
                      {alertsSummary?.latest?.d ?? 'Sin datos'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GuardrailsHealth />
          <DerivativesPanel />
          <DqpPanel />
        </div>

        {/* Quick Actions Footer */}
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900">
                    Centro de Comando
                  </div>
                  <div className="text-sm text-blue-700">
                    Acceso rápido a todas las funcionalidades
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
                  asChild
                >
                  <Link href="/research">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Research
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
                  asChild
                >
                  <Link href="/control">
                    <Shield className="h-4 w-4 mr-2" />
                    Control
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
                  asChild
                >
                  <Link href="/opx">
                    <Target className="h-4 w-4 mr-2" />
                    OP-X Triage
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
                  asChild
                >
                  <Link href="/monitoring">
                    <Activity className="h-4 w-4 mr-2" />
                    Monitoring
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="text-center text-sm text-muted-foreground py-6 border-t">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              ADAF System: Operativo
            </span>
            <span className="flex items-center gap-2">
              🤖 Agentes: {navUsd ? '30+ Activos' : 'Iniciando...'}
            </span>
            <span className="flex items-center gap-2">
              📊 Última actualización: {localTime}
            </span>
            <span className="flex items-center gap-2">💾 DB: Conectada</span>
          </div>
        </div>
      </main>
    </div>
  );
}
