"use client"

import React from 'react';
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VarResp = { varUsd: number; varPct: number; ts: string }
type DdResp = Array<{ date: string; nav: number; ddPct: number; ddUsd: number; peak: number }>

type LimitsResp = {
  limits: Array<{ key: string; value: number; notes: string | null }>
  metrics: Array<{ key: string; value: number; ts: string | null }>
}

function useRiskData() {
  const [var1d, setVar1d] = useState<VarResp | null>(null)
  const [var7d, setVar7d] = useState<VarResp | null>(null)
  const [dd, setDd] = useState<DdResp | null>(null)
  const [limits, setLimits] = useState<LimitsResp | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [v1, v7, d, l] = await Promise.all([
          fetch('/api/read/risk/var?window=1d', { cache: 'no-store' }).then(r=>r.json()),
          fetch('/api/read/risk/var?window=7d', { cache: 'no-store' }).then(r=>r.json()),
          fetch('/api/read/risk/dd?days=90', { cache: 'no-store' }).then(r=>r.json()),
          fetch('/api/read/kpi/limits', { cache: 'no-store' }).then(r=>r.json()),
        ])
        if (cancelled) return
        setVar1d(v1)
        setVar7d(v7)
        setDd(d)
        setLimits(l)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'failed to load risk data')
      }
    })()
    return () => { cancelled = true }
  }, [])
  return { var1d, var7d, dd, limits, error }
}

function MiniLine({ data }: { data: Array<{ date: string; value: number }> }) {
  // super lightweight inline SVG line
  const points = useMemo(() => {
    if (!data.length) return ''
    const w = 200
    const h = 50
    const xs = data.map((_, i) => (i / (data.length - 1)) * w)
    const ys = (() => {
      const vals = data.map(d => d.value)
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const scale = (v: number) => max === min ? h/2 : h - ((v - min) / (max - min)) * h
      return data.map(d => scale(d.value))
    })()
    return data.map((_, i) => `${xs[i]},${ys[i]}`).join(' ')
  }, [data])
  return (
    <svg width={200} height={50} viewBox="0 0 200 50" className="text-emerald-400">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  )
}

export default function RiskPanel() {
  const { var1d, var7d, dd, limits, error } = useRiskData()
  
  // Ensure dd is always an array, even if API returns error
  const ddArray = Array.isArray(dd) ? dd : []
  
  const ddMini = useMemo(() => ddArray.map(r => ({ date: r.date, value: r.ddPct })), [ddArray])
  const ddCurrent = ddArray.length ? ddArray[ddArray.length - 1] : null
  const ddMax = useMemo(() => {
    if (!ddArray.length) return null
    return ddArray.reduce((m, r) => Math.min(m, r.ddPct), 0)
  }, [ddArray])

  // Transform API response to expected structure
  const limitsStructured = useMemo(() => {
    if (!limits || !limits.limits || !Array.isArray(limits.limits)) return null
    
    const limitsMap = Object.fromEntries(limits.limits.map((l: any) => [l.key, l.value]))
    const metricsMap = Object.fromEntries((limits.metrics || []).map((m: any) => [m.key, m.value]))
    
    return {
      limits: {
        ltv: limitsMap.ltv || 0.8,
        hf: limitsMap.hf || 1.6, 
        slippage: limitsMap.slippage || 0.02,
        realyield: limitsMap.realyield || 0.06
      },
      runtime: {
        ltv_current: metricsMap['ltv.current'] || 0,
        hf_current: metricsMap['hf.current'] || 0,
        slippage_current: metricsMap['slippage.current'] || 0,
        realyield_current: metricsMap['realyield.current'] || 0
      }
    }
  }, [limits])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Riesgo & Límites</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-red-500 mb-2">
              {error}
              {error.includes('relation "metrics" does not exist') && (
                <div className="text-xs text-amber-500 mt-1">
                  Tip: Run "pnpm seed" to create database tables and sample data
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">VaR 1d</div>
              <div className="text-lg font-semibold">${(var1d?.varUsd ?? 0).toLocaleString()}</div>
              <div className="text-xs opacity-80">{(var1d?.varPct ?? 0).toFixed(2)}%</div>
            </div>
            <div className="rounded border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">VaR 7d</div>
              <div className="text-lg font-semibold">${(var7d?.varUsd ?? 0).toLocaleString()}</div>
              <div className="text-xs opacity-80">{(var7d?.varPct ?? 0).toFixed(2)}%</div>
            </div>
            <div className="rounded border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">DD actual</div>
              <div className="text-lg font-semibold">{ddCurrent ? `${ddCurrent.ddPct.toFixed(2)}%` : '—'}</div>
              <div className="text-xs opacity-80">${ddCurrent ? (ddCurrent.ddUsd).toLocaleString() : '—'}</div>
            </div>
            <div className="rounded border border-white/10 p-3">
              <div className="text-xs text-muted-foreground">DD máx 90d</div>
              <div className="text-lg font-semibold">{ddMax !== null ? `${ddMax.toFixed(2)}%` : '—'}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-1">Drawdown (90d)</div>
            <MiniLine data={ddMini} />
          </div>

          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">Uso de límites</div>
            <div className="flex flex-wrap gap-2">
              {limitsStructured ? (
                <>
                  <Chip name="Slippage" value={limitsStructured.runtime.slippage_current} limit={limitsStructured.limits.slippage} tone="amber" />
                  <Chip name="LTV" value={limitsStructured.runtime.ltv_current} limit={limitsStructured.limits.ltv} tone="emerald" />
                  <Chip name="HF" value={limitsStructured.runtime.hf_current} limit={limitsStructured.limits.hf} tone="blue" inverse />
                  <Chip name="RealYield" value={limitsStructured.runtime.realyield_current} limit={limitsStructured.limits.realyield} tone="violet" />
                </>
              ) : (
                <div className="text-xs text-muted-foreground">No limit data available</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Chip({ name, value, limit, tone, inverse }: { name: string; value: number; limit: number; tone: 'amber'|'emerald'|'blue'|'violet'; inverse?: boolean }) {
  // inverse = higher is better (HF)
  const ok = inverse ? value >= limit : value <= limit
  const base = ok ? `bg-${tone}-50 text-${tone}-800 border-${tone}-200` : 'bg-red-50 text-red-800 border-red-200'
  return (
    <span className={`text-xs px-2 py-1 rounded border ${base}`}>
      {name}: {value} / {limit}
    </span>
  )
}
