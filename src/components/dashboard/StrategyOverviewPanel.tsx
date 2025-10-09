'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Clock } from 'lucide-react';

interface StrategyOverview {
  id: string;
  name: string;
  category: 'defi' | 'arbitrage' | 'market_making' | 'yield' | 'momentum';
  status: 'active' | 'monitoring' | 'paused';
  allocation: number; // % of portfolio
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    ytd: number;
  };
  metrics: {
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    avgHoldTime: string;
  };
  riskLevel: 'low' | 'medium' | 'high';
}

const mockStrategies: StrategyOverview[] = [
  {
    id: 'defi-yield-001',
    name: 'DeFi Yield Farming',
    category: 'defi',
    status: 'active',
    allocation: 25.5,
    performance: { daily: 0.12, weekly: 0.8, monthly: 3.2, ytd: 18.5 },
    metrics: { sharpe: 1.8, maxDrawdown: -2.1, winRate: 85.2, avgHoldTime: '7d' },
    riskLevel: 'low'
  },
  {
    id: 'arbitrage-002',
    name: 'Cross-Exchange Arbitrage',
    category: 'arbitrage',
    status: 'active',
    allocation: 15.2,
    performance: { daily: 0.08, weekly: 0.5, monthly: 2.1, ytd: 12.8 },
    metrics: { sharpe: 2.1, maxDrawdown: -1.2, winRate: 78.9, avgHoldTime: '15m' },
    riskLevel: 'medium'
  },
  {
    id: 'market-making-003',
    name: 'Stablecoin Market Making',
    category: 'market_making',
    status: 'active',
    allocation: 30.1,
    performance: { daily: 0.05, weekly: 0.35, monthly: 1.4, ytd: 8.9 },
    metrics: { sharpe: 3.2, maxDrawdown: -0.8, winRate: 92.1, avgHoldTime: '2h' },
    riskLevel: 'low'
  },
  {
    id: 'momentum-004',
    name: 'BTC Momentum Trading',
    category: 'momentum',
    status: 'monitoring',
    allocation: 12.8,
    performance: { daily: -0.15, weekly: -1.2, monthly: 0.8, ytd: 15.2 },
    metrics: { sharpe: 1.2, maxDrawdown: -8.5, winRate: 65.4, avgHoldTime: '4h' },
    riskLevel: 'high'
  },
  {
    id: 'yield-opt-005',
    name: 'Yield Optimization',
    category: 'yield',
    status: 'active',
    allocation: 16.4,
    performance: { daily: 0.18, weekly: 1.2, monthly: 4.5, ytd: 22.1 },
    metrics: { sharpe: 2.8, maxDrawdown: -3.2, winRate: 88.7, avgHoldTime: '14d' },
    riskLevel: 'medium'
  }
];

const getCategoryEmoji = (category: StrategyOverview['category']) => {
  switch (category) {
    case 'defi': return '🌾';
    case 'arbitrage': return '⚡';
    case 'market_making': return '🎯';
    case 'yield': return '💰';
    case 'momentum': return '📈';
  }
};

const getStatusColor = (status: StrategyOverview['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'monitoring': return 'bg-blue-100 text-blue-800';
    case 'paused': return 'bg-yellow-100 text-yellow-800';
  }
};

const getRiskColor = (risk: StrategyOverview['riskLevel']) => {
  switch (risk) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
  }
};

export function StrategyOverviewPanel() {
  const totalAllocation = mockStrategies.reduce((sum, s) => sum + s.allocation, 0);
  const totalYTD = mockStrategies.reduce((sum, s) => sum + (s.performance.ytd * s.allocation / 100), 0);
  const avgSharpe = mockStrategies.reduce((sum, s) => sum + s.metrics.sharpe, 0) / mockStrategies.length;
  const activeStrategies = mockStrategies.filter(s => s.status === 'active').length;
  const [mounted, setMounted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('—');

  useEffect(() => {
    setMounted(true);
    const t = new Date();
    setLastUpdate(
      t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Resumen de Estrategias
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {activeStrategies}/{mockStrategies.length} Activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {totalAllocation.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Asignado</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              +{totalYTD.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">YTD</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {avgSharpe.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Sharpe</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">
              {activeStrategies}
            </div>
            <div className="text-xs text-muted-foreground">Ejecutando</div>
          </div>
        </div>

        {/* Strategies List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {mockStrategies.map((strategy) => (
            <div key={strategy.id} className="border rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryEmoji(strategy.category)}</span>
                  <span className="font-medium text-sm">{strategy.name}</span>
                  <Badge variant="outline" className={getStatusColor(strategy.status)}>
                    {strategy.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{strategy.allocation.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">allocation</div>
                </div>
              </div>
              
              {/* Allocation Bar */}
              <div className="mb-2">
                <Progress value={strategy.allocation} className="h-2" />
              </div>
              
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className={`font-medium ${
                    strategy.performance.daily > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {strategy.performance.daily > 0 ? '+' : ''}{strategy.performance.daily.toFixed(2)}%
                  </div>
                  <div className="text-muted-foreground">Daily</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${
                    strategy.performance.monthly > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {strategy.performance.monthly > 0 ? '+' : ''}{strategy.performance.monthly.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">Monthly</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{strategy.metrics.sharpe.toFixed(1)}</div>
                  <div className="text-muted-foreground">Sharpe</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${getRiskColor(strategy.riskLevel)}`}>
                    {strategy.riskLevel.toUpperCase()}
                  </div>
                  <div className="text-muted-foreground">Risk</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Portfolio Performance</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">+{totalYTD.toFixed(1)}% YTD</span>
              </span>
              <span className="text-muted-foreground">
                Last update: {mounted ? lastUpdate : '—'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}