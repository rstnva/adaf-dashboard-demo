'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function BrigadingHeatmap() {
  // Mock heatmap data: [hour][source] = intensity
  const sources = ['X', 'Reddit', 'Telegram'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getIntensity = (hour: number, source: string) => {
    // Mock: higher intensity at peak hours for coordinated activity
    const base = Math.random() * 50;
    const isPeakHour = hour >= 9 && hour <= 17;
    const boost = source === 'X' && isPeakHour ? 40 : 0;
    return Math.min(100, base + boost);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brigading Intensity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left">Source</th>
                {hours.slice(0, 12).map(h => <th key={h} className="p-1">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sources.map(source => (
                <tr key={source}>
                  <td className="p-1 font-semibold">{source}</td>
                  {hours.slice(0, 12).map(h => {
                    const intensity = getIntensity(h, source);
                    const color = intensity > 70 ? 'bg-red-500' : intensity > 40 ? 'bg-orange-400' : 'bg-green-200';
                    return (
                      <td key={h} className="p-1">
                        <div className={`${color} h-6 rounded`} title={`${intensity.toFixed(0)}%`}></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
