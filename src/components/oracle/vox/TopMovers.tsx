'use client';

import React from 'react';
import { useVoxTopMovers } from '@/hooks/useOracleVox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TopMovers() {
  const { data: movers, isLoading } = useVoxTopMovers('24h');
  
  if (isLoading) return <Card><CardContent>Loading top movers...</CardContent></Card>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top VPI Movers (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {movers?.map((signal) => {
            const asset = signal.feedId.split(':')[1] || 'UNKNOWN';
            const isTrending = signal.value > 60;
            return (
              <div key={signal.feedId} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  {isTrending ? <TrendingUp className="text-green-500" size={16} /> : <TrendingDown className="text-red-500" size={16} />}
                  <span className="font-semibold">{asset}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{signal.value.toFixed(0)}</span>
                  <Badge variant={signal.quorum_ok ? 'default' : 'destructive'}>
                    {signal.quorum_ok ? '✓' : '⚠'}
                  </Badge>
                  {signal.stale && <Badge variant="outline">🕒</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
