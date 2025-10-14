'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  CheckCircle,
  SlidersHorizontal,
  BellRing,
  RefreshCw,
  ShieldCheck,
  FileText,
  Radar
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
    lastUpdate: '' // Solo se setea en el cliente
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

    // Set lastUpdate solo en el cliente
    setAgentStatus(prev => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString()
    }));

    // Update agent status every 30 seconds solo en el cliente
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
    <div className="relative min-h-screen overflow-hidden px-6 pb-20 pt-16 text-slate-100">
      <div className="pointer-events-none absolute inset-x-12 top-16 -z-10 h-[420px] rounded-[48px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_45%)] blur-3xl" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
        <div className="glass-panel overflow-hidden px-10 py-12">
          <span className="section-title">ADAF Vision Hub</span>
          <div className="mt-4 grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <h1 className="section-heading">Sistema institucional listo para Apple Vision y operaciones en tiempo real.</h1>
              <p className="section-subheading">
                Orquesta mercados, riesgos y agentes cuantitativos desde una superficie de vidrio interactiva. Optimizado para latencia baja, mock completo y handoff inmediato hacia operaciones.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/markets" prefetch={false}>
                  <Button size="lg" className="rounded-2xl px-6 py-3 text-base">
                    Lanzar Markets
                  </Button>
                </Link>
                <Link href="/opx" prefetch={false}>
                  <Button size="lg" variant="outline" className="rounded-2xl px-6 py-3 text-base">
                    Ver OP-X Live
                  </Button>
                </Link>
                <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em]">
                  MOCK MODE ACTIVO
                </Badge>
              </div>
            </div>
            <div className="lg:col-span-2 grid gap-4">
              {[
                {
                  label: 'BTC Spot',
                  value: marketData ? formatCurrency(marketData.btc.price) : '—',
                  delta: marketData ? marketData.btc.change24h : null,
                },
                {
                  label: 'ETH Spot',
                  value: marketData ? formatCurrency(marketData.eth.price) : '—',
                  delta: marketData ? marketData.eth.change24h : null,
                },
                {
                  label: '24h Volume',
                  value: marketData ? formatBillions(marketData.totalVolume) : '—',
                  delta: null,
                },
                {
                  label: 'Agentes operativos',
                  value: `${agentStatus.active}/${agentStatus.total}`,
                  delta: agentStatus.alerts ? -agentStatus.alerts : null,
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                  {stat.delta !== null && (
                    <span className={cn(
                      "text-sm font-medium",
                      Number(stat.delta) >= 0 ? "text-emerald-300" : "text-rose-300"
                    )}>
                      {Number(stat.delta) >= 0 ? '+' : ''}{stat.delta?.toFixed(2)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/25 via-indigo-500/20 to-purple-500/25" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Dashboard Principal</CardTitle>
                <BarChart3 className="h-5 w-5 text-sky-200" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="mb-4 text-sm text-slate-300/80">
                Acceso completo a mercados, research y reportes
              </p>
              <Link href="/markets" prefetch={false}>
                <Button className="w-full rounded-2xl">Abrir Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/25 via-fuchsia-500/20 to-sky-500/25" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">LAV-ADAF Sistema</CardTitle>
                <Bot className="h-5 w-5 text-purple-200" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="mb-4 text-sm text-slate-300/80">
                {agentStatus.active}/{agentStatus.total} Agentes Activos
              </p>
              <a 
                href="http://localhost:3005" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-sky-500 text-white shadow-[0_10px_40px_-20px_rgba(56,189,248,0.8)] hover:from-purple-500/90 hover:to-sky-500/90">
                  <span>Abrir LAV-ADAF</span>
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-sky-500/20" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Academia</CardTitle>
                <Users className="h-5 w-5 text-emerald-200" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="mb-4 text-sm text-slate-300/80">
                Cursos interactivos y certificaciones
              </p>
              <Link href="/academy" prefetch={false}>
                <Button variant="outline" className="w-full rounded-2xl">Continuar Aprendiendo</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Options Hub */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white">Opciones y Configuración</CardTitle>
                <p className="mt-2 text-sm text-slate-300/80">
                  Ajusta el comportamiento clave del dashboard al estilo terminal institucional.
                </p>
              </div>
              <Badge variant="outline" className="hidden rounded-full px-4 py-2 text-[11px] tracking-[0.35em] md:inline-flex">
                <SlidersHorizontal className="mr-2 h-3 w-3" />
                Panel principal
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Preferencias del Dashboard',
                  description: 'Layout, densidad, idioma y accesos rápidos.',
                  icon: SlidersHorizontal,
                  href: '/control',
                  accent: 'from-sky-500/25 via-indigo-500/20 to-purple-500/25',
                },
                {
                  title: 'Alertas & Notificaciones',
                  description: 'Sensibilidad, canales y escalaciones automáticas.',
                  icon: BellRing,
                  href: '/alerts',
                  accent: 'from-amber-500/25 via-orange-500/20 to-pink-500/25',
                },
                {
                  title: 'Actualización de Datos',
                  description: 'Auto-refresh, health checks y reinicios de agentes.',
                  icon: RefreshCw,
                  href: '/monitoring',
                  accent: 'from-emerald-500/25 via-teal-500/20 to-sky-500/20',
                },
                {
                  title: 'Credenciales & Integraciones',
                  description: 'Llaves, proveedores externos y políticas de acceso.',
                  icon: ShieldCheck,
                  href: '/security',
                  accent: 'from-purple-500/25 via-fuchsia-500/20 to-sky-500/25',
                },
              ].map((item) => (
                <div key={item.title} className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/7 p-5">
                  <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", item.accent)} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-xl border border-white/20 bg-white/10 p-3 text-slate-50">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-slate-200/75">{item.description}</p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-xl border-white/25">
                      <Link href={item.href} prefetch={false}>Abrir</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mini Dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-purple-500/20" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-sky-200" />
                Resumen de Mercados
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {marketData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Bitcoin</p>
                      <p className="text-2xl font-semibold text-white">{formatCurrency(marketData.btc.price)}</p>
                    </div>
                    <Badge variant={marketData.btc.change24h >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
                      {marketData.btc.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {marketData.btc.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Ethereum</p>
                      <p className="text-2xl font-semibold text-white">{formatCurrency(marketData.eth.price)}</p>
                    </div>
                    <Badge variant={marketData.eth.change24h >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
                      {marketData.eth.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {marketData.eth.change24h.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300/75">Volumen 24h:</span>
                      <span className="text-lg font-semibold text-white">{formatBillions(marketData.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-slate-300/75">Fear &amp; Greed Index:</span>
                      <Badge variant={marketData.fear_greed > 50 ? "default" : "secondary"}>
                        {marketData.fear_greed}/100
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-300/80">
                  <Activity className="h-6 w-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-sky-500/20" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="h-5 w-5 text-emerald-200" />
                Estado de Agentes LAV-ADAF
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm">Agentes Activos</span>
                </div>
                <span className="text-lg font-semibold text-white">{agentStatus.active}/{agentStatus.total}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <AlertTriangle className="h-4 w-4 text-rose-300" />
                  <span className="text-sm">Alertas Pendientes</span>
                </div>
                <Badge variant={agentStatus.alerts > 0 ? "destructive" : "default"}>
                  {agentStatus.alerts}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <Clock className="h-4 w-4 text-sky-300" />
                  <span className="text-sm">Última Actualización</span>
                </div>
                <span className="text-sm text-slate-300/75">{agentStatus.lastUpdate}</span>
              </div>

              <div className="rounded-full border border-white/15 bg-white/10 p-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                  style={{ width: `${(agentStatus.active / agentStatus.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-center text-slate-300/75">
                {((agentStatus.active / agentStatus.total) * 100).toFixed(1)}% Operacional
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-sky-200" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[{
                title: 'Frontend ✅',
                description: 'Next.js 15 funcionando',
                accent: 'from-emerald-500/20 via-emerald-400/15 to-sky-500/20',
              }, {
                title: 'APIs ✅',
                description: 'Servicios conectados',
                accent: 'from-sky-500/20 via-blue-500/15 to-indigo-500/20',
              }, {
                title: 'LAV-ADAF ✅',
                description: 'Puerto 3005 activo',
                accent: 'from-purple-500/20 via-fuchsia-500/15 to-emerald-500/20',
              }, {
                title: 'Monitoreo ⚡',
                description: 'Métricas en tiempo real',
                accent: 'from-sky-400/20 via-cyan-500/15 to-emerald-400/20',
              }].map((item) => (
                <div key={item.title} className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/7 p-4">
                  <div className={cn("absolute inset-0 bg-gradient-to-br", item.accent)} />
                  <div className="relative">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-xs text-slate-300/80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/markets" prefetch={false}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <TrendingUp className="h-5 w-5 mb-1" />
              <span>Mercados</span>
            </Button>
          </Link>
          <Link href="/research" prefetch={false}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <Radar className="h-5 w-5 mb-1" />
              <span>Research</span>
            </Button>
          </Link>
          <Link href="/reports" prefetch={false}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <FileText className="h-5 w-5 mb-1" />
              <span>Reportes</span>
            </Button>
          </Link>
          <Link href="/alerts" prefetch={false}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <BellRing className="h-5 w-5 mb-1" />
              <span>Alertas</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
