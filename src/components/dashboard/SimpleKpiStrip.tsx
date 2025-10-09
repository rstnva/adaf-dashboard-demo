'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Activity, Bot, Target, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';

// Componente simplificado de KPIs que funciona sin dependencias externas
export function SimpleKpiStrip({ navUsd, navTs, alertsCount }: { 
  navUsd: number; 
  navTs: string | null; 
  alertsCount: number;
}) {
  // Mock data para demostración
  const kpiData = {
    nav: navUsd,
    pnlDaily: 2847.50,
    pnlWeekly: 12340.25,
    sharpe: 1.82,
    maxDrawdown: -4.2,
    winRate: 78.5,
    tradesTotal: 156,
    activeBots: 5
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📊 Panel de Control Principal
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Sistema Activo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* NAV */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {Intl.NumberFormat('en-US', { notation: 'compact' }).format(kpiData.nav)}
            </div>
            <div className="text-sm text-blue-600 font-medium">NAV (USD)</div>
            <div className="text-xs text-muted-foreground mt-1">
              {navTs ? new Date(navTs).toLocaleDateString() : 'Actualizado'}
            </div>
          </div>

          {/* P&L Diario */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-800">
              +${kpiData.pnlDaily.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium">P&L Diario</div>
            <div className="text-xs text-muted-foreground mt-1">
              +{((kpiData.pnlDaily / kpiData.nav) * 100).toFixed(2)}%
            </div>
          </div>

          {/* P&L Semanal */}
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-800">
              +${kpiData.pnlWeekly.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-600 font-medium">P&L Semanal</div>
            <div className="text-xs text-muted-foreground mt-1">
              +{((kpiData.pnlWeekly / kpiData.nav) * 100).toFixed(2)}%
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {kpiData.sharpe}
            </div>
            <div className="text-sm text-purple-600 font-medium">Sharpe Ratio</div>
            <div className="text-xs text-muted-foreground mt-1">
              Excelente
            </div>
          </div>

          {/* Bots Activos */}
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Bot className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-800">
              {kpiData.activeBots}/8
            </div>
            <div className="text-sm text-indigo-600 font-medium">Bots Activos</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ejecutando
            </div>
          </div>

          {/* Alertas */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-800">
              {alertsCount}
            </div>
            <div className="text-sm text-orange-600 font-medium">Alertas (7d)</div>
            <div className="text-xs text-muted-foreground mt-1">
              Monitoreando
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{kpiData.winRate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{kpiData.tradesTotal}</div>
                <div className="text-xs text-muted-foreground">Trades (30d)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{kpiData.maxDrawdown}%</div>
                <div className="text-xs text-muted-foreground">Max DD</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/pnl">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Ver PnL
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/research">
                  <Zap className="h-4 w-4 mr-1" />
                  Research
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}