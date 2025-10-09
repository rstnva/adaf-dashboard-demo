'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Activity, Pause, Play, Settings, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'idle';
  type: 'arbitrage' | 'market_making' | 'momentum' | 'yield_farming' | 'risk_management';
  lastRun: string;
  performance: {
    pnl: number;
    trades24h: number;
    successRate: number;
  };
  config: {
    enabled: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Mock data para los agentes
const mockAgents: AgentStatus[] = [
  {
    id: 'arb-001',
    name: 'ETF Arbitrage Scanner',
    status: 'active',
    type: 'arbitrage',
    lastRun: '2 min ago',
    performance: { pnl: 1250.45, trades24h: 15, successRate: 87.5 },
    config: { enabled: true, riskLevel: 'medium' }
  },
  {
    id: 'mm-002',
    name: 'USDC-USDT Market Maker',
    status: 'active',
    type: 'market_making',
    lastRun: '30 sec ago',
    performance: { pnl: 567.89, trades24h: 45, successRate: 92.1 },
    config: { enabled: true, riskLevel: 'low' }
  },
  {
    id: 'mom-003',
    name: 'BTC Momentum Bot',
    status: 'paused',
    type: 'momentum',
    lastRun: '1 hour ago',
    performance: { pnl: -123.45, trades24h: 8, successRate: 62.5 },
    config: { enabled: false, riskLevel: 'high' }
  },
  {
    id: 'yield-004',
    name: 'DeFi Yield Optimizer',
    status: 'active',
    type: 'yield_farming',
    lastRun: '5 min ago',
    performance: { pnl: 890.12, trades24h: 3, successRate: 100 },
    config: { enabled: true, riskLevel: 'low' }
  },
  {
    id: 'risk-005',
    name: 'Portfolio Risk Manager',
    status: 'active',
    type: 'risk_management',
    lastRun: '1 min ago',
    performance: { pnl: 0, trades24h: 0, successRate: 0 },
    config: { enabled: true, riskLevel: 'low' }
  }
];

const getStatusColor = (status: AgentStatus['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-300';
    case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'error': return 'bg-red-100 text-red-800 border-red-300';
    case 'idle': return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: AgentStatus['status']) => {
  switch (status) {
    case 'active': return <Activity className="h-3 w-3" />;
    case 'paused': return <Pause className="h-3 w-3" />;
    case 'error': return <AlertTriangle className="h-3 w-3" />;
    case 'idle': return <Bot className="h-3 w-3" />;
  }
};

const getTypeEmoji = (type: AgentStatus['type']) => {
  switch (type) {
    case 'arbitrage': return '⚡';
    case 'market_making': return '🎯';
    case 'momentum': return '📈';
    case 'yield_farming': return '🌾';
    case 'risk_management': return '🛡️';
  }
};

export function ActiveBotsStatus() {
  const [agents] = useState<AgentStatus[]>(mockAgents);

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalPnl = agents.reduce((sum, a) => sum + a.performance.pnl, 0);
  const totalTrades = agents.reduce((sum, a) => sum + a.performance.trades24h, 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            Bots Activos ({activeCount}/{agents.length})
          </CardTitle>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              ${totalPnl > 0 ? '+' : ''}
              {totalPnl.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">PnL 24h</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{totalTrades}</div>
            <div className="text-xs text-muted-foreground">Trades 24h</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Activos</div>
          </div>
        </div>

        {/* Agents List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-lg">{getTypeEmoji(agent.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{agent.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Last: {agent.lastRun}</span>
                    <span>•</span>
                    <span>{agent.performance.trades24h} trades</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Performance Indicator */}
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    agent.performance.pnl > 0 ? 'text-green-600' : 
                    agent.performance.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {agent.performance.pnl > 0 ? '+' : ''}${agent.performance.pnl.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {agent.performance.successRate.toFixed(1)}% win
                  </div>
                </div>
                
                {/* Status Badge */}
                <Badge variant="outline" className={getStatusColor(agent.status)}>
                  {getStatusIcon(agent.status)}
                  <span className="ml-1 capitalize">{agent.status}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Sistema LAV-ADAF ejecutándose
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Play className="h-3 w-3 mr-1" />
              Iniciar Todo
            </Button>
            <Button size="sm" variant="outline">
              <Pause className="h-3 w-3 mr-1" />
              Pausar Todo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}