/**
 * Webhook Alerting - Tests
 * Fortune 500 Standard: Comprehensive webhook testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookDelivery } from '../../../webhooks/delivery';
import type { WebhookConfig } from '../../../webhooks/config';
import type { QuorumFailEvent } from '../../../webhooks/events';
import { formatForSlack, formatForDiscord } from '../../../webhooks/templates';

describe('WebhookDelivery', () => {
  let delivery: WebhookDelivery;
  let fetchMock: any;

  beforeEach(() => {
    delivery = new WebhookDelivery();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockWebhook = (overrides?: Partial<WebhookConfig>): WebhookConfig => ({
    enabled: true,
    url: 'https://hooks.slack.com/test',
    channel: 'slack',
    name: 'Test Webhook',
    timeout_ms: 5000,
    retry: {
      enabled: true,
      max_attempts: 3,
      backoff_ms: 100,
    },
    events: {
      quorum_fail: true,
      stale_feed: true,
      rate_limit_violation: true,
      dq_quarantine: true,
      adapter_offline: true,
      consensus_timeout: true,
    },
    ...overrides,
  });

  const createMockEvent = (): QuorumFailEvent => ({
    id: 'alert-123',
    type: 'quorum_fail',
    severity: 'high',
    feedId: 'price/btc_usd.live',
    message: 'Quorum failed for feed',
    details: {
      required: 3,
      actual: 1,
      sources_failed: ['chainlink-btc', 'pyth-btc'],
      last_successful: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    environment: 'production',
  });

  describe('deliverAlert', () => {
    it('delivers to enabled webhooks', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

      const webhook = createMockWebhook();
      const event = createMockEvent();

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].webhook_name).toBe('Test Webhook');
      expect(results[0].attempts).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('skips disabled webhooks', async () => {
      const webhook = createMockWebhook({ enabled: false });
      const event = createMockEvent();

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips webhooks when event type is disabled', async () => {
      const webhook = createMockWebhook({
        events: {
          quorum_fail: false,
          stale_feed: true,
          rate_limit_violation: true,
          dq_quarantine: true,
          adapter_offline: true,
          consensus_timeout: true,
        },
      });
      const event = createMockEvent();

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('filters by severity level', async () => {
      const webhook = createMockWebhook({
        filters: { min_severity: 'critical' },
      });
      const event = createMockEvent(); // severity: 'high'

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('filters by feed IDs', async () => {
      const webhook = createMockWebhook({
        filters: { feed_ids: ['price/eth_usd.live'] },
      });
      const event = createMockEvent(); // feedId: 'price/btc_usd.live'

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('retries on failure', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' })
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' });

      const webhook = createMockWebhook();
      const event = createMockEvent();

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results[0].success).toBe(true);
      expect(results[0].attempts).toBe(3);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('stops retrying on 4xx errors', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

      const webhook = createMockWebhook();
      const event = createMockEvent();

      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results[0].success).toBe(false);
      expect(results[0].attempts).toBe(1); // Only 1 attempt
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('opens circuit breaker after threshold failures', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

      const webhook = createMockWebhook({ retry: { enabled: false, max_attempts: 1, backoff_ms: 0 } });
      const event = createMockEvent();

      // Trigger 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await delivery.deliverAlert(event, [webhook]);
      }

      // 6th attempt should be blocked by circuit breaker
      const results = await delivery.deliverAlert(event, [webhook]);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Circuit breaker open');
      expect(results[0].attempts).toBe(0);
    });
  });

  describe('formatForSlack', () => {
    it('formats event with correct structure', () => {
      const event = createMockEvent();
      const payload = formatForSlack(event);

      expect(payload.text).toContain('QUORUM FAIL');
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments![0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Feed ID', value: '`price/btc_usd.live`' }),
          expect.objectContaining({ title: 'Severity', value: 'HIGH' }),
        ])
      );
    });

    it('includes type-specific details', () => {
      const event = createMockEvent();
      const payload = formatForSlack(event);

      const fields = payload.attachments![0].fields;
      expect(fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Required', value: '3' }),
          expect.objectContaining({ title: 'Actual', value: '1' }),
        ])
      );
    });
  });

  describe('formatForDiscord', () => {
    it('formats event with correct structure', () => {
      const event = createMockEvent();
      const payload = formatForDiscord(event);

      expect(payload.content).toContain('Oracle Alert');
      expect(payload.embeds).toHaveLength(1);
      expect(payload.embeds![0].title).toContain('QUORUM FAIL');
      expect(payload.embeds![0].color).toBe(0xff6600); // high severity color
    });

    it('includes feed ID and severity', () => {
      const event = createMockEvent();
      const payload = formatForDiscord(event);

      const fields = payload.embeds![0].fields;
      expect(fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Feed ID', value: '`price/btc_usd.live`' }),
          expect.objectContaining({ name: 'Severity', value: 'HIGH' }),
        ])
      );
    });
  });
});
