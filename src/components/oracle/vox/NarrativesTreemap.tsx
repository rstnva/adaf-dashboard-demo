'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function NarrativesTreemap() {
  const narratives = [
    { name: 'ETF BTC', dominance: 35, color: 'bg-blue-500' },
    { name: 'Restaking', dominance: 22, color: 'bg-purple-500' },
    { name: 'AI tokens', dominance: 18, color: 'bg-green-500' },
    { name: 'L2', dominance: 15, color: 'bg-orange-500' },
    { name: 'RWA', dominance: 10, color: 'bg-pink-500' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Narrative Dominance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {narratives.map(narrative => (
            <div
              key={narrative.name}
              className={`${narrative.color} p-4 rounded text-white flex flex-col justify-center items-center`}
              style={{ minHeight: `${narrative.dominance * 2}px` }}
            >
              <div className="font-semibold">{narrative.name}</div>
              <div className="text-2xl">{narrative.dominance}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
