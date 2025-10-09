import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const daysReq = Number(url.searchParams.get('days') || 14)
    const days = Math.max(1, Math.min(60, Number.isFinite(daysReq) ? daysReq : 14))

    const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche', 'Fantom', 'BSC']
    const rows = []

    for (let d = 0; d < days; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)
      const dateStr = date.toISOString().split('T')[0]

      for (const chain of chains) {
        let baseTvl
        switch (chain) {
          case 'Ethereum': baseTvl = 45000000000; break
          case 'Polygon': baseTvl = 1200000000; break   
          case 'Arbitrum': baseTvl = 2800000000; break
          case 'Optimism': baseTvl = 800000000; break
          case 'Base': baseTvl = 1500000000; break
          case 'Avalanche': baseTvl = 900000000; break
          case 'BSC': baseTvl = 3200000000; break
          default: baseTvl = 500000000; break
        }

        const variation = (Math.random() - 0.5) * 0.1
        const tvlUsd = baseTvl * (1 + variation)

        rows.push({
          date: dateStr,
          chain,
          tvlUsd: Math.round(tvlUsd)
        })
      }
    }

    rows.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.tvlUsd - a.tvlUsd
    })

    return NextResponse.json(rows)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
