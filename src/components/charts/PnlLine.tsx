"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from "@tanstack/react-query"
import { getPNLSeries } from "@/lib/data/pnl"

export function PnlLine() {
  const { data } = useQuery({ queryKey: ["pnl"], queryFn: getPNLSeries })
  if (!data) {
    return <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis 
          tickFormatter={(value) => `$${(value as number).toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'PnL']}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line 
          type="monotone" 
          dataKey="pnl" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}