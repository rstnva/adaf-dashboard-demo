"use client"

import { KpiCard } from "@/components/panels/KpiCard"
import { PnlLine } from "@/components/charts/PnlLine"
import { PresetsDrawer } from "@/components/panels/PresetsDrawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePlan } from "@/lib/state/usePlan"
import { useQuery } from "@tanstack/react-query"
import { getAPY } from "@/lib/data/apy"
import { getTVL } from "@/lib/data/tvl"
import { FLAGS } from "@/lib/config/flags"
import { GUARDAILS } from "@/lib/config/guardrails"

export default function DashboardPage() {
  const { executionPlan } = usePlan()
  const { data: apy } = useQuery({ queryKey: ["apy"], queryFn: getAPY })
  const { data: tvl } = useQuery({ queryKey: ["tvl"], queryFn: getTVL })

  const currentAPY = apy ?? 0
  const getSemaphoreColor = (apy: number) => {
    if (apy > 6) return { color: "bg-green-500", text: "Verde" }
    if (apy >= 3) return { color: "bg-yellow-500", text: "Amarillo" } 
    return { color: "bg-red-500", text: "Rojo" }
  }
  
  const semaphore = getSemaphoreColor(currentAPY)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ADAF Dashboard Pro</h1>
        {FLAGS.semaforoPlus ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${semaphore.color} cursor-help text-white`}>
                  Semáforo LAV: {semaphore.text}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  Slippage ≤ {(GUARDAILS.maxSlippage * 100).toFixed(2)}%<br />
                  LTV Objetivo {GUARDAILS.targetLTV * 100}% (Max {GUARDAILS.maxLTV * 100}%)<br />
                  Min HF {GUARDAILS.minHF}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge className={`${semaphore.color} text-white`}>
            Semáforo LAV: {semaphore.text}
          </Badge>
        )}
      </div>
      
      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!tvl ? (
          <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <KpiCard title="TVL (Total Value Locked)" value={tvl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} subtitle="+12.5% desde ayer" trend="up" />
        )}
        {!apy ? (
          <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <KpiCard title="APY Neto" value={`${apy.toFixed(1)}%`} subtitle="Rendimiento anualizado" trend={apy > 6 ? 'up' : apy < 3 ? 'down' : 'neutral'} />
        )}
        <KpiCard title="PnL 24h" value="$15,420" subtitle="+2.8% cambio" trend="up" />
      </div>

      {/* Chart and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>PnL Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <PnlLine />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <PresetsDrawer />
            </CardContent>
          </Card>
          
          {executionPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Presets:</strong> {executionPlan.presets.map(p=>p.name).join(', ')}</p>
                  <p><strong>Confirmado:</strong> {new Date(executionPlan.confirmedAt ?? Date.now()).toLocaleString()}</p>
                  {FLAGS.semaforoPlus && (
                    <div className="text-xs text-muted-foreground">
                      Reglas: Slippage ≤ {(GUARDAILS.maxSlippage*100).toFixed(2)}%, LTV Objetivo {GUARDAILS.targetLTV*100}%, Max LTV {GUARDAILS.maxLTV*100}%, Min HF {GUARDAILS.minHF}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}