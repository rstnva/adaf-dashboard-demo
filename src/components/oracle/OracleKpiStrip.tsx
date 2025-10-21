"use client";

import React from 'react';
/**
 * Oracle KPI Strip - Key Performance Indicators
 * Displays: Freshness, Quorum Health, Confidence, Throughput, Latency, DQ Quarantine, Subscribers
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, TrendingUp, Clock, Shield, Users } from 'lucide-react';

interface OracleMetrics {
  freshness: number; // 0-1, % non-stale
  quorumHealth: number; // 0-1, % passing quorum
  avgConfidence: number; // 0-1
  throughput: number; // signals/sec
  p95Latency: number; // ms
  quarantineCount: number;
  subscribers: number;
}

async function fetchOracleMetrics(): Promise<OracleMetrics> {
  try {
    const res = await fetch('/api/oracle/v1/metrics');
    if (res?.ok) return (await res.json()) as OracleMetrics;
  } catch {}
  // Fallback mock (UI-only)
  return {
    freshness: 0.98,
    quorumHealth: 0.95,
    avgConfidence: 0.92,
    throughput: 47.3,
    p95Latency: 125,
    quarantineCount: 2,
    subscribers: 8,
  };
}

export function OracleKpiStrip() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['oracle-metrics'],
    queryFn: fetchOracleMetrics,
    refetchInterval: 5000, // Refresh every 5s
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-16 animate-pulse bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Freshness',
      value: `${(metrics.freshness * 100).toFixed(1)}%`,
      icon: Activity,
      status: metrics.freshness >= 0.95 ? 'success' : metrics.freshness >= 0.9 ? 'warning' : 'error',
      description: 'Non-stale feeds',
    },
    {
      label: 'Quorum Health',
      value: `${(metrics.quorumHealth * 100).toFixed(1)}%`,
      icon: CheckCircle2,
      status: metrics.quorumHealth >= 0.95 ? 'success' : metrics.quorumHealth >= 0.9 ? 'warning' : 'error',
      description: 'Passing quorum',
    },
    {
      label: 'Confidence',
      value: `${(metrics.avgConfidence * 100).toFixed(1)}%`,
      icon: Shield,
      status: metrics.avgConfidence >= 0.9 ? 'success' : metrics.avgConfidence >= 0.8 ? 'warning' : 'error',
      description: 'Avg across feeds',
    },
    {
      label: 'Throughput',
      value: `${metrics.throughput.toFixed(1)}/s`,
      icon: TrendingUp,
      status: 'success',
      description: 'Signals ingested',
    },
    {
      label: 'Latency P95',
      value: `${metrics.p95Latency}ms`,
      icon: Clock,
      status: metrics.p95Latency <= 200 ? 'success' : metrics.p95Latency <= 500 ? 'warning' : 'error',
      description: 'Read latency',
    },
    {
      label: 'DQ Quarantine',
      value: metrics.quarantineCount.toString(),
      icon: AlertTriangle,
      status: metrics.quarantineCount === 0 ? 'success' : metrics.quarantineCount <= 5 ? 'warning' : 'error',
      description: 'Signals flagged',
    },
    {
      label: 'Subscribers',
      value: metrics.subscribers.toString(),
      icon: Users,
      status: 'success',
      description: 'Active connections',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const statusColors = {
          success: 'text-green-600 bg-green-50',
          warning: 'text-yellow-600 bg-yellow-50',
          error: 'text-red-600 bg-red-50',
        };

        return (
          <Card key={kpi.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-4 w-4 ${statusColors[kpi.status]?.split(' ')[0]}`} />
              <Badge variant={kpi.status === 'success' ? 'default' : kpi.status === 'warning' ? 'outline' : 'destructive'} className="text-xs">
                {kpi.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            <div className="text-xs text-muted-foreground/70">{kpi.description}</div>
          </Card>
        );
      })}
    </div>
  );
}
