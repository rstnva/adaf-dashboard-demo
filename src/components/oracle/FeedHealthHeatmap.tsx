"use client";

import React from 'react';
/**
 * Feed Health Heatmap - Per-feed status table
 * Shows: stale, quorum, confidence, TTL, last update, sparkline
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProvenanceModal } from './ProvenanceModal';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface FeedHealth {
  feedId: string;
  stale: boolean;
  quorumOk: boolean;
  confidence: number;
  ttlMs: number;
  lastUpdate: string; // ISO timestamp
  sparkline: number[]; // Last 10 values for mini chart
  latestSignalId?: string;
}

async function fetchFeedHealth(): Promise<FeedHealth[]> {
  try {
    const res = await fetch('/api/oracle/v1/feeds/health');
    if (res?.ok) return (await res.json()) as FeedHealth[];
  } catch {}
  // Fallback mock (UI-only)
  return [
    {
      feedId: 'price/btc_usd.live',
      stale: false,
      quorumOk: true,
      confidence: 0.95,
      ttlMs: 60000,
      lastUpdate: new Date(Date.now() - 15000).toISOString(),
      sparkline: [63200, 63300, 63500, 63400, 63600, 63700, 63500, 63800, 63900, 64000],
      latestSignalId: 'sig-abc123',
    },
    {
      feedId: 'price/eth_usd.live',
      stale: false,
      quorumOk: true,
      confidence: 0.92,
      ttlMs: 60000,
      lastUpdate: new Date(Date.now() - 8000).toISOString(),
      sparkline: [2800, 2820, 2840, 2850, 2830, 2860, 2870, 2880, 2890, 2900],
      latestSignalId: 'sig-def456',
    },
    {
      feedId: 'defi/tvl_total.daily',
      stale: false,
      quorumOk: true,
      confidence: 0.88,
      ttlMs: 3600000,
      lastUpdate: new Date(Date.now() - 300000).toISOString(),
      sparkline: [45.2, 45.5, 45.8, 46.1, 46.0, 45.9, 46.2, 46.5, 46.3, 46.7],
      latestSignalId: 'sig-ghi789',
    },
    {
      feedId: 'funding/btc_perp.live',
      stale: true,
      quorumOk: false,
      confidence: 0.45,
      ttlMs: 300000,
      lastUpdate: new Date(Date.now() - 600000).toISOString(),
      sparkline: [0.01, 0.015, 0.012, 0.008, 0.01, 0.011, 0.009, 0.007, 0.006, 0.005],
      latestSignalId: 'sig-jkl012',
    },
  ];
}

export function FeedHealthHeatmap() {
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const { data: feeds, isLoading } = useQuery({
    queryKey: ['feed-health'],
    queryFn: fetchFeedHealth,
    refetchInterval: 10000, // Refresh every 10s
  });

  if (isLoading || !feeds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feed Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading feed health data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTimeSince = (isoDate: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Feed Health Heatmap</CardTitle>
          <CardDescription>Real-time status for all oracle feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-medium">Feed ID</th>
                  <th className="pb-2 font-medium text-center">Stale</th>
                  <th className="pb-2 font-medium text-center">Quorum</th>
                  <th className="pb-2 font-medium text-center">Confidence</th>
                  <th className="pb-2 font-medium text-center">TTL</th>
                  <th className="pb-2 font-medium">Last Update</th>
                  <th className="pb-2 font-medium">Trend</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr key={feed.feedId} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-mono text-xs">{feed.feedId}</td>
                    <td className="py-3 text-center">
                      {feed.stale ? (
                        <XCircle className="h-4 w-4 text-red-500 inline" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {feed.quorumOk ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 inline" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          feed.confidence >= 0.9 ? 'default' : feed.confidence >= 0.7 ? 'outline' : 'destructive'
                        }
                      >
                        {(feed.confidence * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-xs text-muted-foreground">
                      {feed.ttlMs < 60000
                        ? `${feed.ttlMs / 1000}s`
                        : feed.ttlMs < 3600000
                        ? `${feed.ttlMs / 60000}m`
                        : `${feed.ttlMs / 3600000}h`}
                    </td>
                    <td className="py-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {getTimeSince(feed.lastUpdate)}
                      </div>
                    </td>
                    <td className="py-3">
                      <Sparkline data={feed.sparkline} />
                    </td>
                    <td className="py-3">
                      {feed.latestSignalId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSignalId(feed.latestSignalId!)}
                        >
                          Provenance
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedSignalId && (
        <ProvenanceModal signalId={selectedSignalId} onClose={() => setSelectedSignalId(null)} />
      )}
    </>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 15;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="60" height="20" className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-500"
      />
    </svg>
  );
}
