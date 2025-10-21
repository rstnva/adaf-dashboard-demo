"use client";

import React from 'react';
/**
 * Quality Alerts Panel - DQ issues, stale feeds, quorum failures
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

interface QualityAlert {
  id: string;
  type: 'stale' | 'quorum_fail' | 'dq_quarantine' | 'rate_limit';
  feedId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

async function fetchQualityAlerts(): Promise<QualityAlert[]> {
  try {
    const res = await fetch('/api/oracle/v1/alerts');
    if (res?.ok) return (await res.json()) as QualityAlert[];
  } catch {}
  // Fallback mock (UI-only)
  return [
    {
      id: 'alert-1',
      type: 'quorum_fail',
      feedId: 'funding/btc_perp.live',
      severity: 'high',
      message: 'Quorum failed: only 1 of 3 sources responded',
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 'alert-2',
      type: 'dq_quarantine',
      feedId: 'price/sol_usd.live',
      severity: 'medium',
      message: 'Value outside 3σ range: 145.2 (expected 120-130)',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
  ];
}

export function QualityAlertsPanel() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['quality-alerts'],
    queryFn: fetchQualityAlerts,
    refetchInterval: 15000, // Refresh every 15s
  });

  const severityConfig = {
    critical: { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
    high: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle },
    medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle },
    low: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: AlertCircle },
  };

  const typeLabels = {
    stale: 'Stale Feed',
    quorum_fail: 'Quorum Failure',
    dq_quarantine: 'DQ Quarantine',
    rate_limit: 'Rate Limit',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Alerts</CardTitle>
        <CardDescription>Data quality issues and anomalies</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs">All feeds operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;

              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${config.bgColor}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.color} mt-0.5`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[alert.type]}
                        </Badge>
                        <Badge
                          variant={
                            alert.severity === 'critical' || alert.severity === 'high'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{alert.feedId}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
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
