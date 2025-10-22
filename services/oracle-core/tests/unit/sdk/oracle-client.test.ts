import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OracleClient, OracleHttpError } from '../../../serve/sdk/ts/client';
import type { Feed } from '../../../serve/sdk/ts/types';

// Mock fetch globally
global.fetch = vi.fn();

describe('OracleClient', () => {
  let client: OracleClient;
  const baseUrl = 'http://localhost:3000';
  const token = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OracleClient({ baseUrl, token });
  });

  describe('constructor', () => {
    it('strips trailing slash from baseUrl', () => {
      const clientWithSlash = new OracleClient({ baseUrl: 'http://localhost:3000/' });
      expect((clientWithSlash as any).baseUrl).toBe('http://localhost:3000');
    });

    it('stores token when provided', () => {
      expect((client as any).token).toBe(token);
    });

    it('handles missing token', () => {
      const clientNoToken = new OracleClient({ baseUrl });
      expect((clientNoToken as any).token).toBeUndefined();
    });
  });

  describe('listFeeds', () => {
    it('fetches feeds list successfully', async () => {
      const mockFeeds: Feed[] = [
        {
          id: 'price/btc_usd.live',
          name: 'BTC/USD Price Feed',
          category: 'price',
          unit: 'USD',
          ttl_ms: 60000,
          quorum: { k: 3, n: 5 },
          sources: [
            { id: 'binance', weight: 1.0 },
            { id: 'coinbase', weight: 1.0 },
          ],
          tags: ['crypto', 'btc'],
          version: 1,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feeds: mockFeeds }),
      });

      const result = await client.listFeeds();

      expect(result.feeds).toEqual(mockFeeds);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/oracle/v1/feeds',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('throws OracleHttpError on failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error' })
      });

      await expect(client.listFeeds()).rejects.toThrow(OracleHttpError);
      await expect(client.listFeeds()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('getLatest', () => {
    it('fetches latest signal for feed', async () => {
      const mockSignal = {
        id: 'sig-123',
        feedId: 'price/btc_usd.live',
        ts: '2025-10-16T14:00:00Z',
        value: 63500.0,
        unit: 'USD',
        confidence: 0.95,
        quorum_ok: true,
        stale: false,
        evidence: [
          {
            source_id: 'chainlink-btc',
            captured_at: '2025-10-16T14:00:00Z',
          },
        ],
        tags: [],
        rev: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSignal,
      });

      const result = await client.getLatest('price/btc_usd.live');

      expect(result).toEqual(mockSignal);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/oracle/v1/feeds/price/btc_usd.live/latest',
        expect.any(Object)
      );
    });

    it('throws on 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Feed not found',
      });

      await expect(client.getLatest('invalid-feed')).rejects.toThrow('Feed not found');
    });
  });

  describe('query', () => {
    it('posts query and returns results', async () => {
      const mockResult = [{
        id: 'sig-123',
        feedId: 'price/btc_usd.live',
        ts: new Date().toISOString(),
        value: 63500,
        unit: 'USD',
        confidence: 0.95,
        quorum_ok: true,
        stale: false,
        evidence: [],
        tags: [],
        rev: 1
      }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await client.query({ feedIds: ['price/btc_usd.live'], since: '2025-10-16T00:00:00Z' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('publish', () => {
    it('publishes signal successfully', async () => {
      const signal = {
        id: 'sig-123',
        feedId: 'price/btc_usd.live',
        ts: '2025-10-16T14:00:00Z',
        value: 63500.0,
        unit: 'USD',
        confidence: 0.95,
        quorum_ok: true,
        stale: false,
        evidence: [],
        tags: [],
        rev: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, rev: 2 }),
      });

      const result = await client.publish('price/btc_usd.live', signal);

      expect(result).toEqual({ ok: true, rev: 2 });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/oracle/v1/publish',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...signal, feedId: 'price/btc_usd.live' }),
        })
      );
    });

    it('throws on 403 forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden - insufficient scopes',
        json: async () => ({ error: 'Forbidden - insufficient scopes' })
      });

      const signal = {
        id: 'sig-123',
        feedId: 'price/btc_usd.live',
        ts: new Date().toISOString(),
        value: 63500.0,
        unit: 'USD',
        confidence: 0.95,
        quorum_ok: true,
        stale: false,
        evidence: [],
        tags: [],
        rev: 1,
      };

      await expect(client.publish('price/btc_usd.live', signal)).rejects.toThrow('Forbidden');
    });
  });

  describe('subscribe', () => {
    it('creates WebSocket connection and returns unsubscribe function', () => {
      const mockWs = {
        addEventListener: vi.fn(),
        close: vi.fn(),
      };

      // Mock WebSocket constructor
      (global as any).WebSocket = vi.fn(() => mockWs);

      const callback = vi.fn();
      const unsubscribe = client.subscribe('price/btc_usd.live', callback);

      expect((global as any).WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:3000/api/oracle/v1/subscribe?feedId=price%2Fbtc_usd.live')
      );

      expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

      // Test unsubscribe
      unsubscribe();
      expect(mockWs.close).toHaveBeenCalled();
    });

    it('parses WebSocket messages and calls callback', () => {
      const mockWs: any = {
        addEventListener: vi.fn(),
        close: vi.fn(),
      };

      (global as any).WebSocket = vi.fn(() => mockWs);

      const callback = vi.fn();
      client.subscribe('price/btc_usd.live', callback);

      // Get the message handler
      const messageHandler = (mockWs.addEventListener as any).mock.calls[0][1];

      const mockSignal = {
        id: 'sig-123',
        feedId: 'price/btc_usd.live',
        ts: new Date().toISOString(),
        value: 63500.0,
        unit: 'USD',
        confidence: 0.95,
        quorum_ok: true,
        stale: false,
        evidence: [],
        tags: [],
        rev: 1,
      };

      // Simulate message event
      messageHandler({ data: JSON.stringify(mockSignal) });

      expect(callback).toHaveBeenCalledWith(mockSignal);
    });

    it('handles invalid JSON in WebSocket messages', () => {
      const mockWs = {
        addEventListener: vi.fn(),
        close: vi.fn(),
      };

      (global as any).WebSocket = vi.fn(() => mockWs);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const callback = vi.fn();

      client.subscribe('price/btc_usd.live', callback);

      const messageHandler = (mockWs.addEventListener as any).mock.calls[0][1];
      messageHandler({ data: 'invalid json' });

      expect(callback).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'oracle-sdk: failed to parse message',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('includes status code in OracleHttpError', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      try {
        await client.listFeeds();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OracleHttpError);
        expect((error as OracleHttpError).statusCode).toBe(429);
        expect((error as OracleHttpError).message).toBe('Rate limit exceeded');
      }
    });

    it('handles empty error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      });

      try {
        await client.listFeeds();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as OracleHttpError).message).toBe('Oracle request failed');
      }
    });
  });

  describe('headers', () => {
    it('includes authorization header when token provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feeds: [] }),
      });

      await client.listFeeds();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('omits authorization header when token not provided', async () => {
      const clientNoToken = new OracleClient({ baseUrl });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feeds: [] }),
      });

      await clientNoToken.listFeeds();

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });
  });
});
