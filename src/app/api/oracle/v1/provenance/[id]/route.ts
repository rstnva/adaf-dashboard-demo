/**
 * Oracle Provenance API - Signal Lineage Endpoint
 *
 * GET /api/oracle/v1/provenance/[id]
 * Returns complete provenance chain for a given signal ID
 *
 * Mock-first implementation - Replace with real data source when ready
 * TODO_REPLACE_WITH_REAL_DATA: Connect to lineage storage service
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Types
// =============================================================================

interface EvidenceRef {
  source_id: string;
  url?: string;
  hash?: string;
  round_id?: string;
  price_id?: string;
  block_number?: number;
  block_hash?: string;
  captured_at: string;
}

interface SignalProvenance {
  signalId: string;
  feedId: string;
  value: number;
  unit: string;
  confidence: number;
  timestamp: string;
  evidence: EvidenceRef[];
  consensusMethod: string;
  quorumPassed: boolean;
  metadata?: {
    sources_count: number;
    consensus_threshold: number;
    processing_time_ms: number;
  };
}

// =============================================================================
// Mock Data Generator (Fortune 500 Mock-First Strategy)
// =============================================================================

const MOCK_FEEDS = [
  { id: 'price/btc_usd.live', asset: 'BTC', base: 64000, variance: 500 },
  { id: 'price/eth_usd.live', asset: 'ETH', base: 3200, variance: 100 },
  { id: 'price/sol_usd.live', asset: 'SOL', base: 145, variance: 5 },
  {
    id: 'tvl/aave.mainnet',
    asset: 'AAVE TVL',
    base: 12500000000,
    variance: 100000000,
  },
  {
    id: 'funding/btc_perp.dydx',
    asset: 'BTC Funding',
    base: 0.01,
    variance: 0.005,
  },
];

const MOCK_SOURCES = [
  {
    id: 'chainlink',
    type: 'oracle',
    urlTemplate: 'https://data.chain.link/feeds/ethereum/mainnet/{asset}-usd',
  },
  {
    id: 'pyth',
    type: 'oracle',
    urlTemplate: 'https://pyth.network/price-feeds/crypto-{asset}-usd',
  },
  {
    id: 'redstone',
    type: 'oracle',
    urlTemplate: 'https://app.redstone.finance/#/app/data-services',
  },
  {
    id: 'chainlink-arbitrum',
    type: 'oracle',
    urlTemplate: 'https://data.chain.link/feeds/arbitrum/mainnet/{asset}-usd',
  },
  {
    id: 'chronicle',
    type: 'oracle',
    urlTemplate: 'https://chroniclelabs.org/dashboard/oracle/{asset}',
  },
];

function generateMockProvenance(signalId: string): SignalProvenance {
  // Parse signal ID to determine feed
  const feedMatch = MOCK_FEEDS.find(f =>
    signalId.includes(f.asset.toLowerCase())
  );
  const feed = feedMatch || MOCK_FEEDS[0];

  // Generate random value within variance
  const value = feed.base + (Math.random() - 0.5) * 2 * feed.variance;

  // Generate evidence from 3-5 sources
  const numSources = 3 + Math.floor(Math.random() * 3);
  const selectedSources = MOCK_SOURCES.slice(0, numSources);

  const evidence: EvidenceRef[] = selectedSources.map((source, idx) => {
    const capturedAt = new Date(Date.now() - (5000 - idx * 1000)).toISOString();

    const baseEvidence: EvidenceRef = {
      source_id: `${source.id}-${feed.asset.toLowerCase()}`,
      captured_at: capturedAt,
    };

    // Add source-specific fields
    if (source.id.includes('chainlink')) {
      return {
        ...baseEvidence,
        url: source.urlTemplate.replace('{asset}', feed.asset.toLowerCase()),
        round_id: `1844674407370${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, '0')}`,
      };
    }

    if (source.id === 'pyth') {
      // Pyth uses hex price IDs
      const priceIds: Record<string, string> = {
        BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
        SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      };
      return {
        ...baseEvidence,
        url: source.urlTemplate.replace('{asset}', feed.asset.toLowerCase()),
        price_id:
          priceIds[feed.asset] ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
    }

    if (source.id === 'redstone') {
      return {
        ...baseEvidence,
        url: source.urlTemplate,
        hash: `0x${Math.floor(Math.random() * 1e16)
          .toString(16)
          .padStart(16, '0')}`,
      };
    }

    // Chronicle and others
    return {
      ...baseEvidence,
      url: source.urlTemplate.replace('{asset}', feed.asset.toUpperCase()),
      block_number: 18000000 + Math.floor(Math.random() * 100000),
      block_hash: `0x${Math.floor(Math.random() * 1e16)
        .toString(16)
        .padStart(64, '0')}`,
    };
  });

  // Calculate consensus metrics
  const confidence = 0.85 + Math.random() * 0.14; // 85-99%
  const quorumPassed = confidence >= 0.85;

  return {
    signalId,
    feedId: feed.id,
    value: parseFloat(value.toFixed(feed.id.includes('funding') ? 6 : 2)),
    unit: feed.id.includes('tvl')
      ? 'USD'
      : feed.id.includes('funding')
        ? '%'
        : 'USD',
    confidence: parseFloat(confidence.toFixed(4)),
    timestamp: new Date().toISOString(),
    evidence,
    consensusMethod: 'weighted_median',
    quorumPassed,
    metadata: {
      sources_count: evidence.length,
      consensus_threshold: 0.85,
      processing_time_ms: 150 + Math.floor(Math.random() * 100),
    },
  };
}

// =============================================================================
// API Handler
// =============================================================================

export async function GET(
  request: NextRequest,
  // Use 'any' to be compatible with both Next15 (Promise-based params) and tests (plain object params)
  context: any
) {
  try {
    const maybeParams = context?.params;
    const resolvedParams =
      maybeParams && typeof maybeParams?.then === 'function'
        ? await maybeParams
        : maybeParams;
    const { id: signalId } = (resolvedParams || {}) as { id?: string };

    // Validate signal ID
    if (!signalId || signalId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Invalid signal ID',
          code: 'INVALID_SIGNAL_ID',
          message: 'Signal ID is required',
        },
        { status: 400 }
      );
    }

    // TODO_REPLACE_WITH_REAL_DATA: Replace mock with actual lineage query
    // Example:
    // const provenance = await getLineageTrace({
    //   entity: 'signal',
    //   refId: signalId,
    // });

    // Generate mock provenance
    const provenance = generateMockProvenance(signalId);

    // Add cache headers for performance
    const response = NextResponse.json(provenance, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'X-Mock-Data': 'true', // Indicate this is mock data
      },
    });

    return response;
  } catch (error) {
    console.error('[Provenance API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Export route segment config
// =============================================================================

export const runtime = 'nodejs'; // Use Node.js runtime for better compatibility
export const dynamic = 'force-dynamic'; // Always generate fresh data
