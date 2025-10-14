"use client"

import { NavigationGuard } from '@/components/NavigationGuard'

export default function PnlPage() {
  return (
    <NavigationGuard fallbackUrl="/" storageKey="pnl-view">
      <div className="container mx-auto px-6 py-8 space-y-4">
        <h1 className="text-3xl font-bold">PnL (Profit &amp; Loss)</h1>
        <p className="text-lg text-gray-600">
          Página central de métricas y visualizaciones de PnL. Aquí se mostrarán los gráficos, tablas y KPIs relacionados con la evolución de utilidades y pérdidas.
        </p>
        <div className="mt-6 rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-gray-500">
          <em>Placeholder: Integra aquí los componentes de PnL, como PnlLine, PnlBucketsChart, etc.</em>
        </div>
      </div>
    </NavigationGuard>
  )
}
