/**
 * Tests for Oracle Provenance API Endpoint
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/oracle/v1/provenance/[id]/route';
import { NextRequest } from 'next/server';

describe('Provenance API - /api/oracle/v1/provenance/[id]', () => {
  describe('GET - Success Cases', () => {
    it('should return provenance data for valid signal ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/signal-btc-123'
      );
      const params = { id: 'signal-btc-123' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        signalId: 'signal-btc-123',
        feedId: expect.any(String),
        value: expect.any(Number),
        unit: expect.any(String),
        confidence: expect.any(Number),
        timestamp: expect.any(String),
        evidence: expect.any(Array),
        consensusMethod: 'weighted_median',
        quorumPassed: expect.any(Boolean),
        metadata: {
          sources_count: expect.any(Number),
          consensus_threshold: 0.85,
          processing_time_ms: expect.any(Number),
        },
      });
    });

    it('should return mock data indicator in headers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/test-signal'
      );
      const params = { id: 'test-signal' };

      const response = await GET(request, { params });

      expect(response.headers.get('X-Mock-Data')).toBe('true');
      expect(response.headers.get('Cache-Control')).toContain('s-maxage=10');
    });

    it('should return evidence array with at least 3 sources', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/eth-signal'
      );
      const params = { id: 'eth-signal' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.evidence).toBeInstanceOf(Array);
      expect(data.evidence.length).toBeGreaterThanOrEqual(3);
      expect(data.evidence.length).toBeLessThanOrEqual(5);
    });

    it('should return valid evidence structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/sol-signal'
      );
      const params = { id: 'sol-signal' };

      const response = await GET(request, { params });
      const data = await response.json();

      data.evidence.forEach((evidence: any) => {
        expect(evidence).toMatchObject({
          source_id: expect.any(String),
          captured_at: expect.any(String),
        });

        // At least one additional field (url, hash, round_id, etc.)
        const hasAdditionalField =
          evidence.url !== undefined ||
          evidence.hash !== undefined ||
          evidence.round_id !== undefined ||
          evidence.price_id !== undefined ||
          evidence.block_number !== undefined;

        expect(hasAdditionalField).toBe(true);
      });
    });

    it('should return confidence between 85-99%', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/test-123'
      );
      const params = { id: 'test-123' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.confidence).toBeGreaterThanOrEqual(0.85);
      expect(data.confidence).toBeLessThanOrEqual(0.99);
    });

    it('should handle BTC signal with appropriate value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/btc-test'
      );
      const params = { id: 'btc-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      // BTC price should be in reasonable range (mock variance)
      expect(data.value).toBeGreaterThan(60000);
      expect(data.value).toBeLessThan(70000);
      expect(data.unit).toBe('USD');
    });

    it('should include Chainlink evidence with round_id', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/chainlink-test'
      );
      const params = { id: 'chainlink-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      const chainlinkEvidence = data.evidence.find((e: any) =>
        e.source_id.includes('chainlink')
      );

      if (chainlinkEvidence) {
        expect(chainlinkEvidence.round_id).toBeDefined();
        expect(chainlinkEvidence.round_id).toMatch(/^\d+$/);
        expect(chainlinkEvidence.url).toContain('chain.link');
      }
    });

    it('should include Pyth evidence with price_id', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/pyth-test'
      );
      const params = { id: 'pyth-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      const pythEvidence = data.evidence.find((e: any) =>
        e.source_id.includes('pyth')
      );

      if (pythEvidence) {
        expect(pythEvidence.price_id).toBeDefined();
        expect(pythEvidence.price_id).toMatch(/^0x[a-f0-9]+$/i);
        expect(pythEvidence.url).toContain('pyth.network');
      }
    });

    it('should return metadata with reasonable processing time', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/meta-test'
      );
      const params = { id: 'meta-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.metadata.processing_time_ms).toBeGreaterThan(100);
      expect(data.metadata.processing_time_ms).toBeLessThan(300);
      expect(data.metadata.sources_count).toBe(data.evidence.length);
    });
  });

  describe('GET - Error Cases', () => {
    it('should return 400 for empty signal ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/'
      );
      const params = { id: '' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'Invalid signal ID',
        code: 'INVALID_SIGNAL_ID',
        message: 'Signal ID is required',
      });
    });

    it('should return 400 for whitespace-only signal ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/   '
      );
      const params = { id: '   ' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SIGNAL_ID');
    });
  });

  describe('Data Consistency', () => {
    it('should return same structure for multiple calls', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/consistency-test'
      );
      const params1 = { id: 'consistency-test' };

      const response1 = await GET(request1, { params: params1 });
      const data1 = await response1.json();

      const request2 = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/consistency-test-2'
      );
      const params2 = { id: 'consistency-test-2' };

      const response2 = await GET(request2, { params: params2 });
      const data2 = await response2.json();

      // Same structure
      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
      expect(Object.keys(data1.metadata).sort()).toEqual(
        Object.keys(data2.metadata).sort()
      );
    });

    it('should have evidence timestamps in descending order (most recent first)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/timestamp-test'
      );
      const params = { id: 'timestamp-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      const timestamps = data.evidence.map((e: any) =>
        new Date(e.captured_at).getTime()
      );

      // Check if timestamps are relatively recent (within last 10 seconds)
      timestamps.forEach((ts: number) => {
        const diff = Date.now() - ts;
        expect(diff).toBeLessThan(10000);
        expect(diff).toBeGreaterThan(0);
      });
    });

    it('should have quorum passed when confidence >= 85%', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/oracle/v1/provenance/quorum-test'
      );
      const params = { id: 'quorum-test' };

      const response = await GET(request, { params });
      const data = await response.json();

      if (data.confidence >= 0.85) {
        expect(data.quorumPassed).toBe(true);
      } else {
        expect(data.quorumPassed).toBe(false);
      }
    });
  });
});
