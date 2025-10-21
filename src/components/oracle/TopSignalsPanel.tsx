"use client";

import React from 'react';
/**
 * Top Signals & Events Panel - Recent signals, z-scores, news impact
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TopSignal {
  feedId: string;
  value: number;
  unit: string;
  change24h: number; // percentage
  zScore: number;
  timestamp: string;
  newsImpact?: 'high' | 'medium' | 'low';
}

async function fetchTopSignals(): Promise<TopSignal[]> {
  try {
    const res = await fetch('/api/oracle/v1/signals/top');
    if (res?.ok) return (await res.json()) as TopSignal[];
  } catch {}
  // Fallback mock (UI-only)
  return [
    {
      feedId: 'price/btc_usd.live',
      value: 64000,
      unit: 'USD',
      change24h: 3.2,
      zScore: 1.8,
      timestamp: new Date(Date.now() - 15000).toISOString(),
      newsImpact: 'high',
    },
    {
      feedId: 'price/eth_usd.live',
      value: 2900,
      unit: 'USD',
      change24h: -1.5,
      zScore: -0.4,
      timestamp: new Date(Date.now() - 8000).toISOString(),
      newsImpact: 'medium',
    },
    {
      feedId: 'defi/tvl_total.daily',
      value: 46.7,
      unit: 'B',
      change24h: 0.8,
      zScore: 0.2,
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      feedId: 'funding/btc_perp.live',
      value: 0.0012,
      unit: '%',
      change24h: 15.3,
      zScore: 2.3,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      newsImpact: 'high',
    },
  ];
}

export function TopSignalsPanel() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ['top-signals'],
    queryFn: fetchTopSignals,
    refetchInterval: 15000, // Refresh every 15s
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Signals & Events</CardTitle>
        <CardDescription>Recent signals with notable movements</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : !signals || signals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No recent signals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => {
              const isPositive = signal.change24h > 0;
              const isNeutral = Math.abs(signal.change24h) < 0.1;
              const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

              return (
                <div key={signal.feedId} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono text-xs text-muted-foreground">{signal.feedId}</div>
                    {signal.newsImpact && (
                      <Badge
                        variant={signal.newsImpact === 'high' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        News: {signal.newsImpact}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">
                      {signal.value.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{signal.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : isNeutral ? 'text-gray-600' : 'text-red-600'}`}>
                      <TrendIcon className="h-4 w-4" />
                      {isPositive ? '+' : ''}{signal.change24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <div>
                      Z-Score: <span className={Math.abs(signal.zScore) > 2 ? 'text-orange-600 font-medium' : ''}>{signal.zScore.toFixed(2)}</span>
                    </div>
                    <div>{new Date(signal.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
