/**
 * Oracle Command Center UI Tests
 * Fortune 500 Standard: Comprehensive component testing
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OracleKpiStrip } from '@/components/oracle/OracleKpiStrip';
import { FeedHealthHeatmap } from '@/components/oracle/FeedHealthHeatmap';
import { QualityAlertsPanel } from '@/components/oracle/QualityAlertsPanel';
import { ConsumerStatusPanel } from '@/components/oracle/ConsumerStatusPanel';
import { TopSignalsPanel } from '@/components/oracle/TopSignalsPanel';

// Mock fetch globally
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('OracleKpiStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        freshness: 0.98,
        quorumHealth: 0.95,
        avgConfidence: 0.92,
        throughput: 47.3,
        p95Latency: 125,
        quarantineCount: 2,
        subscribers: 8,
      }),
    });

    render(<OracleKpiStrip />, { wrapper: createWrapper() });

    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
  });

  it('displays KPI metrics after loading', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        freshness: 0.98,
        quorumHealth: 0.95,
        avgConfidence: 0.92,
        throughput: 47.3,
        p95Latency: 125,
        quarantineCount: 2,
        subscribers: 8,
      }),
    });

    render(<OracleKpiStrip />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('98.0%')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('92.0%')).toBeInTheDocument();
    });
  });

  it('shows success badge for healthy freshness', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        freshness: 0.98,
        quorumHealth: 0.95,
        avgConfidence: 0.92,
        throughput: 47.3,
        p95Latency: 125,
        quarantineCount: 2,
        subscribers: 8,
      }),
    });

    render(<OracleKpiStrip />, { wrapper: createWrapper() });

    await waitFor(() => {
      const badges = screen.getAllByText('success');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});

describe('FeedHealthHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<FeedHealthHeatmap />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading feed health/i)).toBeInTheDocument();
  });

  it('displays feed health table after loading', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
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
      ],
    });

    render(<FeedHealthHeatmap />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('price/btc_usd.live')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });

  it('shows provenance button for feeds with signals', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          feedId: 'price/btc_usd.live',
          stale: false,
          quorumOk: true,
          confidence: 0.95,
          ttlMs: 60000,
          lastUpdate: new Date(Date.now() - 15000).toISOString(),
          sparkline: [63200, 63300, 63500],
          latestSignalId: 'sig-abc123',
        },
      ],
    });

    render(<FeedHealthHeatmap />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Provenance')).toBeInTheDocument();
    });
  });
});

describe('QualityAlertsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows no alerts message when empty', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<QualityAlertsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no active alerts/i)).toBeInTheDocument();
    });
  });

  it('displays alerts with severity badges', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'alert-1',
          type: 'quorum_fail',
          feedId: 'funding/btc_perp.live',
          severity: 'high',
          message: 'Quorum failed: only 1 of 3 sources responded',
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ],
    });

    render(<QualityAlertsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Quorum Failure')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText(/quorum failed/i)).toBeInTheDocument();
    });
  });
});

describe('ConsumerStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays consumer list', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'wsp',
          name: 'WSP (Whale Sentiment)',
          status: 'active',
          feedsConsumed: 5,
          lastHeartbeat: new Date(Date.now() - 3000).toISOString(),
          avgLatency: 45,
        },
      ],
    });

    render(<ConsumerStatusPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('WSP (Whale Sentiment)')).toBeInTheDocument();
      const actives = screen.getAllByText('Active');
      expect(actives.length).toBeGreaterThan(0);
    });
  });

  it('shows consumer metrics', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'wsp',
          name: 'WSP (Whale Sentiment)',
          status: 'active',
          feedsConsumed: 5,
          lastHeartbeat: new Date(Date.now() - 3000).toISOString(),
          avgLatency: 45,
        },
      ],
    });

    render(<ConsumerStatusPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
      expect(screen.getByText(/\d+s ago/)).toBeInTheDocument();
    });
  });
});

describe('TopSignalsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays top signals with trends', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          feedId: 'price/btc_usd.live',
          value: 64000,
          unit: 'USD',
          change24h: 3.2,
          zScore: 1.8,
          timestamp: new Date(Date.now() - 15000).toISOString(),
          newsImpact: 'high',
        },
      ],
    });

    render(<TopSignalsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('price/btc_usd.live')).toBeInTheDocument();
      expect(screen.getByText('64,000')).toBeInTheDocument();
      expect(screen.getByText('+3.20%')).toBeInTheDocument();
    });
  });

  it('shows news impact badge', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          feedId: 'price/btc_usd.live',
          value: 64000,
          unit: 'USD',
          change24h: 3.2,
          zScore: 1.8,
          timestamp: new Date(Date.now() - 15000).toISOString(),
          newsImpact: 'high',
        },
      ],
    });

    render(<TopSignalsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      const badges = screen.getAllByText(/news:/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
