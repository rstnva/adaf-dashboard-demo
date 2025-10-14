"use client"

import { NavigationGuard } from '@/components/NavigationGuard'

export default function DqpPage() {
  return (
    <NavigationGuard fallbackUrl="/" storageKey="dqp-health">
      <div className="container mx-auto px-6 py-8 space-y-4">
        <h1 className="text-3xl font-bold">DQP Health &amp; Overview</h1>
        <p className="text-lg text-gray-600">
          Página central para monitoreo y salud de DQP. Aquí se mostrarán paneles, tarjetas y métricas relevantes al estado y calidad de datos del sistema.
        </p>
        <div className="mt-6 rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-gray-500">
          <em>Placeholder: Integra aquí los componentes de DQP, como DqpHealthCard, paneles de incidentes, etc.</em>
        </div>
      </div>
    </NavigationGuard>
  )
}
