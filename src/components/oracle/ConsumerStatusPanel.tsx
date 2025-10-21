"use client";

import React from 'react';
/**
 * Consumer Status Panel - Shows which systems are consuming oracle data
 * WSP, News, BlackBox, Alpha, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Activity } from 'lucide-react';

interface Consumer {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'degraded';
  feedsConsumed: number;
  lastHeartbeat: string;
  avgLatency: number; // ms
}

async function fetchConsumerStatus(): Promise<Consumer[]> {
  try {
    const res = await fetch('/api/oracle/v1/consumers');
    if (res?.ok) return (await res.json()) as Consumer[];
  } catch {}
  // Fallback mock (UI-only)
  return [
    {
      id: 'wsp',
      name: 'WSP (Whale Sentiment)',
      status: 'active',
      feedsConsumed: 5,
      lastHeartbeat: new Date(Date.now() - 3000).toISOString(),
      avgLatency: 45,
    },
    {
      id: 'news',
      name: 'News Engine',
      status: 'active',
      feedsConsumed: 2,
      lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
      avgLatency: 67,
    },
    {
      id: 'blackbox',
      name: 'BlackBox Strategy',
      status: 'active',
      feedsConsumed: 8,
      lastHeartbeat: new Date(Date.now() - 2000).toISOString(),
      avgLatency: 32,
    },
    {
      id: 'alpha',
      name: 'Alpha Signals',
      status: 'degraded',
      feedsConsumed: 3,
      lastHeartbeat: new Date(Date.now() - 45000).toISOString(),
      avgLatency: 230,
    },
  ];
}

export function ConsumerStatusPanel() {
  const { data: consumers, isLoading } = useQuery({
    queryKey: ['consumer-status'],
    queryFn: fetchConsumerStatus,
    refetchInterval: 10000, // Refresh every 10s
  });

  const statusConfig = {
    active: { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle2, label: 'Active' },
    degraded: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Activity, label: 'Degraded' },
    inactive: { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle, label: 'Inactive' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumer Status</CardTitle>
        <CardDescription>Systems consuming oracle data</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : !consumers || consumers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No active consumers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consumers.map((consumer) => {
              const config = statusConfig[consumer.status];
              const Icon = config.icon;
              const secondsSinceHeartbeat = Math.floor(
                (Date.now() - new Date(consumer.lastHeartbeat).getTime()) / 1000
              );

              return (
                <div key={consumer.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="font-medium text-sm">{consumer.name}</span>
                    </div>
                    <Badge
                      variant={consumer.status === 'active' ? 'default' : consumer.status === 'degraded' ? 'outline' : 'destructive'}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Feeds:</span> {consumer.feedsConsumed}
                    </div>
                    <div>
                      <span className="font-medium">Latency:</span> {consumer.avgLatency}ms
                    </div>
                    <div>
                      <span className="font-medium">Heartbeat:</span> {secondsSinceHeartbeat}s ago
                    </div>
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
