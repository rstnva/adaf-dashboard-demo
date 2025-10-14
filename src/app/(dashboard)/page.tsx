// Dashboard Principal - Vista principal accesible desde el layout (dashboard)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LintStatusCard } from '@/components/dashboard/LintStatusCard';
import {
  Activity,
  BarChart3,
  BellRing,
  ExternalLink,
  RefreshCw,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardMainPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ADAF Dashboard Pro
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema integrado de análisis y monitoreo financiero
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Activity className="w-4 h-4 mr-1" />
          MOCK_MODE Activo
        </Badge>
      </div>

      {/* Quick Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mercados</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Análisis de mercados, ETFs y comparaciones
            </p>
            <Link href="./markets">
              <Button className="w-full" size="sm">
                Ver Mercados
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Research</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Investigación y análisis cuantitativo
            </p>
            <Link href="./research">
              <Button className="w-full" size="sm">
                Ver Research
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Seguridad</CardTitle>
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Monitoreo de seguridad y compliance
            </p>
            <Link href="./security">
              <Button className="w-full" size="sm">
                Ver Seguridad
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">MOCK</div>
              <div className="text-sm text-gray-600">Modo de datos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">ACTIVO</div>
              <div className="text-sm text-gray-600">Estado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LintStatusCard />

      {/* Options Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Opciones y Configuración</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Panel rápido para ajustar el comportamiento del dashboard al
                vuelo.
              </p>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex">
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Preferencias
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between border rounded-lg p-4 bg-slate-50">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-blue-100 text-blue-600 p-2">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    Preferencias del Dashboard
                  </h3>
                  <p className="text-xs text-gray-600">
                    Layout, densidad, idioma y permisos principales.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href="./control">Abrir Control</Link>
              </Button>
            </div>

            <div className="flex items-start justify-between border rounded-lg p-4 bg-amber-50">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-amber-100 text-amber-600 p-2">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    Alertas &amp; Notificaciones
                  </h3>
                  <p className="text-xs text-gray-600">
                    Ajusta sensibilidad, canales de entrega y escalaciones.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="./alerts">Configurar alertas</Link>
              </Button>
            </div>

            <div className="flex items-start justify-between border rounded-lg p-4 bg-emerald-50">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-emerald-100 text-emerald-600 p-2">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    Actualización de Datos
                  </h3>
                  <p className="text-xs text-gray-600">
                    Controla el auto-refresh, health checks y reinicios de
                    agentes.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="./monitoring">Panel de monitoreo</Link>
              </Button>
            </div>

            <div className="flex items-start justify-between border rounded-lg p-4 bg-purple-50">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-purple-100 text-purple-600 p-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    Credenciales &amp; Integraciones
                  </h3>
                  <p className="text-xs text-gray-600">
                    Administra llaves, proveedores externos y políticas de
                    acceso.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="./security">Centro de seguridad</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
