"use client"

import AlertsTable from '@/components/AlertsTable'
import { NavigationGuard } from '@/components/NavigationGuard'

export const dynamic = 'force-dynamic'

export default function AlertsPage() {
  return (
    <NavigationGuard fallbackUrl="/" storageKey="alerts-view">
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Alertas</h1>
        <AlertsTable />
      </div>
    </NavigationGuard>
  )
}
