'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function InfluencersBoard() {
  const influencers = [
    { handle: '@crypto_whale', credScore: 0.92, impact: 850 },
    { handle: '@eth_researcher', credScore: 0.88, impact: 720 },
    { handle: '@defi_wizard', credScore: 0.85, impact: 680 },
    { handle: '@nft_alpha', credScore: 0.78, impact: 540 },
    { handle: '@btc_maxi', credScore: 0.75, impact: 500 },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Influencers (Cred × Impact)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {influencers.map((inf, idx) => (
            <div key={inf.handle} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">#{idx + 1}</span>
                <span className="font-semibold">{inf.handle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Cred: {(inf.credScore * 100).toFixed(0)}%</Badge>
                <span className="text-sm text-gray-500">Impact: {inf.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
