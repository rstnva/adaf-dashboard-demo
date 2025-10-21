/**
 * Oracle Command Center - Main Dashboard
 * Fortune 500 Standard: Real-time monitoring, operational excellence
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { OracleKpiStrip } from '@/components/oracle/OracleKpiStrip';
import { FeedHealthHeatmap } from '@/components/oracle/FeedHealthHeatmap';
import { QualityAlertsPanel } from '@/components/oracle/QualityAlertsPanel';
import { ConsumerStatusPanel } from '@/components/oracle/ConsumerStatusPanel';
import { TopSignalsPanel } from '@/components/oracle/TopSignalsPanel';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Oracle Command Center | ADAF Pro',
  description: 'Real-time oracle monitoring, feed health, and data quality dashboard',
};

export default function OracleCommandCenterPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Oracle Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Multi-source oracle monitoring • Real-time feed health • Data quality assurance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode:</span>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {process.env.ORACLE_SOURCE_MODE || 'SHADOW'}
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <OracleKpiStrip />
      </Suspense>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feed Health Heatmap - 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<Card className="h-96"><Skeleton className="h-full" /></Card>}>
            <FeedHealthHeatmap />
          </Suspense>
        </div>

        {/* Quality Alerts - 1 column */}
        <div>
          <Suspense fallback={<Card className="h-96"><Skeleton className="h-full" /></Card>}>
            <QualityAlertsPanel />
          </Suspense>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consumer Status */}
        <Suspense fallback={<Card className="h-64"><Skeleton className="h-full" /></Card>}>
          <ConsumerStatusPanel />
        </Suspense>

        {/* Top Signals & Events */}
        <Suspense fallback={<Card className="h-64"><Skeleton className="h-full" /></Card>}>
          <TopSignalsPanel />
        </Suspense>
      </div>
    </div>
  );
}
