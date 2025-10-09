'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Volume2 } from 'lucide-react'

export default function MarketComparePage() {
  const [selectedAssets, setSelectedAssets] = useState(['BTC', 'ETH'])
  const [timeframe, setTimeframe] = useState('7D')
  
  // Mock comparison data
  const comparisonData = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67234.56,
      change24h: 2.34,
      volume24h: 28500000000,
      marketCap: 1320000000000,
      dominance: 54.2,
      volatility: 3.8,
      sharpeRatio: 1.45,
      maxDrawdown: -12.3,
      correlation: 1.0
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2456.78,
      change24h: 1.89,
      volume24h: 15200000000,
      marketCap: 295000000000,
      dominance: 17.8,
      volatility: 4.2,
      sharpeRatio: 1.23,
      maxDrawdown: -18.7,
      correlation: 0.82
    }
  ]

  const availableAssets = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'MATIC', name: 'Polygon' }
  ]

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`
    return `$${num.toLocaleString()}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Market Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Compare performance metrics across different digital assets
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1 Day</SelectItem>
              <SelectItem value="7D">7 Days</SelectItem>
              <SelectItem value="30D">30 Days</SelectItem>
              <SelectItem value="90D">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Asset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Asset Selection
          </CardTitle>
          <CardDescription>
            Choose assets to compare (up to 5)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableAssets.map((asset) => (
              <Button
                key={asset.symbol}
                variant={selectedAssets.includes(asset.symbol) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedAssets.includes(asset.symbol)) {
                    setSelectedAssets(prev => prev.filter(s => s !== asset.symbol))
                  } else if (selectedAssets.length < 5) {
                    setSelectedAssets(prev => [...prev, asset.symbol])
                  }
                }}
              >
                {asset.symbol} - {asset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>
            Detailed metrics comparison for selected assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>24h Change</TableHead>
                  <TableHead>Volume (24h)</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>Dominance</TableHead>
                  <TableHead>Volatility</TableHead>
                  <TableHead>Sharpe Ratio</TableHead>
                  <TableHead>Max Drawdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData
                  .filter(asset => selectedAssets.includes(asset.symbol))
                  .map((asset) => (
                  <TableRow key={asset.symbol}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-sm text-muted-foreground">{asset.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatNumber(asset.price, 2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {asset.change24h > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={asset.change24h > 0 ? "default" : "destructive"}>
                          {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatNumber(asset.volume24h)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatNumber(asset.marketCap)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {asset.dominance.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {asset.volatility.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={asset.sharpeRatio > 1 ? "default" : "outline"}>
                        {asset.sharpeRatio.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {asset.maxDrawdown.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BTC</div>
            <p className="text-xs text-muted-foreground">
              +2.34% in 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Volume</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BTC</div>
            <p className="text-xs text-muted-foreground">
              $28.5B traded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Leader</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BTC</div>
            <p className="text-xs text-muted-foreground">
              54.2% dominance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BTC</div>
            <p className="text-xs text-muted-foreground">
              1.45 ratio
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}