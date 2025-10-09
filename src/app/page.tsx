'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  BarChart3, 
  Shield, 
  Activity,
  DollarSign,
  Users,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface MarketData {
  btc: { price: number; change24h: number; };
  eth: { price: number; change24h: number; };
  totalVolume: number;
  fear_greed: number;
}

interface AgentStatus {
  total: number;
  active: number;
  alerts: number;
  lastUpdate: string;
}

export default function HomePage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    total: 30,
    active: 27,
    alerts: 3,
    lastUpdate: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    // Mock market data - in real app this would fetch from API
    const mockData: MarketData = {
      btc: { price: 67420, change24h: 2.34 },
      eth: { price: 2685, change24h: -1.23 },
      totalVolume: 28500000000,
      fear_greed: 74
    };
    setMarketData(mockData);

    // Update agent status every 30 seconds
    const interval = setInterval(() => {
      setAgentStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatBillions = (value: number) => 
    `$${(value / 1000000000).toFixed(1)}B`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ADAF Dashboard Pro
          </h1>
          <p className="text-xl text-gray-600">
            Inteligencia de Mercados • Gestión de Riesgos • Optimización de Estrategias
          </p>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dashboard Principal</CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Acceso completo a mercados, research y reportes
              </p>
              <Link href="/dashboard">
                <Button className="w-full">Abrir Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">LAV-ADAF Sistema</CardTitle>
                <Bot className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {agentStatus.active}/{agentStatus.total} Agentes Activos
              </p>
              <a 
                href="http://localhost:3005" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <span>Abrir LAV-ADAF</span>
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Academia</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Cursos interactivos y certificaciones
              </p>
              <Link href="/academy">
                <Button variant="outline" className="w-full">Continuar Aprendiendo</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Mini Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumen de Mercados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Bitcoin</p>
                      <p className="text-2xl font-bold">{formatCurrency(marketData.btc.price)}</p>
                    </div>
                    <Badge variant={marketData.btc.change24h >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
                      {marketData.btc.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {marketData.btc.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ethereum</p>
                      <p className="text-2xl font-bold">{formatCurrency(marketData.eth.price)}</p>
                    </div>
                    <Badge variant={marketData.eth.change24h >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
                      {marketData.eth.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {marketData.eth.change24h.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Volumen 24h:</span>
                      <span className="font-semibold">{formatBillions(marketData.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Fear & Greed Index:</span>
                      <Badge variant={marketData.fear_greed > 50 ? "default" : "secondary"}>
                        {marketData.fear_greed}/100
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <Activity className="h-6 w-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Estado de Agentes LAV-ADAF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Agentes Activos</span>
                  </div>
                  <span className="font-bold text-green-600">{agentStatus.active}/{agentStatus.total}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Alertas Pendientes</span>
                  </div>
                  <Badge variant={agentStatus.alerts > 0 ? "destructive" : "default"}>
                    {agentStatus.alerts}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Última Actualización</span>
                  </div>
                  <span className="text-sm text-gray-600">{agentStatus.lastUpdate}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(agentStatus.active / agentStatus.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {((agentStatus.active / agentStatus.total) * 100).toFixed(1)}% Operacional
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-green-800">Frontend ✅</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">Next.js 15 funcionando</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-green-800">APIs ✅</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">Servicios conectados</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-green-800">LAV-ADAF ✅</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">Puerto 3005 activo</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-blue-800">Monitoreo ⚡</h3>
                </div>
                <p className="text-sm text-blue-700 mt-1">Métricas en tiempo real</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/markets">
            <Button variant="outline" className="w-full h-16 flex-col">
              <TrendingUp className="h-5 w-5 mb-1" />
              <span>Mercados</span>
            </Button>
          </Link>
          
          <Link href="/research">
            <Button variant="outline" className="w-full h-16 flex-col">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span>Research</span>
            </Button>
          </Link>
          
          <Link href="/reports">
            <Button variant="outline" className="w-full h-16 flex-col">
              <Shield className="h-5 w-5 mb-1" />
              <span>Reportes</span>
            </Button>
          </Link>
          
          <Link href="/control">
            <Button variant="outline" className="w-full h-16 flex-col">
              <Activity className="h-5 w-5 mb-1" />
              <span>Control</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}