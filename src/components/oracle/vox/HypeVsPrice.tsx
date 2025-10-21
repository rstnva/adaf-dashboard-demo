'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function HypeVsPrice() {
  // Mock data for divergence HP
  const assets = [
    { symbol: 'BTC', vpiDelta: 15, priceDelta: 3, divergence: 0.42 },
    { symbol: 'ETH', vpiDelta: -8, priceDelta: -2, divergence: 0.18 },
    { symbol: 'SOL', vpiDelta: 22, priceDelta: 18, divergence: 0.08 },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hype vs Price Divergence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assets.map((asset) => {
            const isHighDivergence = asset.divergence > 0.3;
            return (
              <div key={asset.symbol} className="border-b pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{asset.symbol}</span>
                  {isHighDivergence && <Badge variant="destructive">High Divergence</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500">VPI Δ</div>
                    <div className={asset.vpiDelta > 0 ? 'text-green-600' : 'text-red-600'}>
                      {asset.vpiDelta > 0 ? '+' : ''}{asset.vpiDelta}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Price Δ</div>
                    <div className={asset.priceDelta > 0 ? 'text-green-600' : 'text-red-600'}>
                      {asset.priceDelta > 0 ? '+' : ''}{asset.priceDelta}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Divergence</div>
                    <div className={isHighDivergence ? 'text-orange-600 font-semibold' : ''}>
                      {(asset.divergence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
