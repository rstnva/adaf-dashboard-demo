// Dashboard Principal - Vista principal accesible desde el layout (dashboard)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Shield, Activity, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DashboardMainPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ADAF Dashboard Pro
          </h1>
          <p className="text-gray-600 mt-2">Sistema integrado de análisis y monitoreo financiero</p>
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
    </div>
  )
}