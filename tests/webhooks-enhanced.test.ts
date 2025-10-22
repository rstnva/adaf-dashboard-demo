import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendQuarantineAlert } from '@/lib/oracle/quarantine-webhooks';

describe('Enhanced Webhooks (Retries & HMAC)', () => {
  const OLD_ENV = { ...process.env } as NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.SLACK_CRITICAL_WEBHOOK;
    delete process.env.WEBHOOK_HMAC_SECRET;
  });

  it('retries on 500 server error', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';

    let attempts = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        return { ok: false, status: 500, text: async () => 'Server error' };
      }
      return { ok: true, text: async () => 'ok' };
    });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/btc_usd.live',
      reason: 'quorum_fail',
      severity: 'critical',
    });

    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 15000); // Increase timeout for retries

  it('does not retry on 400 client error', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/eth_usd.live',
      reason: 'invalid_data',
    });

    expect(res.ok).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No retries on 4xx
  });

  it('adds HMAC signature when secret provided', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.WEBHOOK_HMAC_SECRET = 'test-secret-123';

    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => 'ok' });
    (global as any).fetch = mockFetch;

    await sendQuarantineAlert({
      feedId: 'price/sol_usd.live',
      reason: 'stale_data',
    });

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['x-webhook-signature']).toBeDefined();
    expect(callHeaders['x-webhook-signature']).toMatch(/^mock-hmac-/);
  });

  it('routes critical alerts to special channel', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.SLACK_CRITICAL_WEBHOOK = 'https://hooks.slack.com/critical';

    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => 'ok' });
    (global as any).fetch = mockFetch;

    await sendQuarantineAlert({
      feedId: 'price/aave_usd.live',
      reason: 'consensus_fail',
      severity: 'critical',
    });

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://hooks.slack.com/critical');
  });

  it('fails after max retries exhausted', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/link_usd.live',
      reason: 'rate_limit',
    });

    expect(res.ok).toBe(false);
    expect(res.response).toContain('Failed after 4 attempts'); // Initial + 3 retries
    expect(mockFetch).toHaveBeenCalledTimes(4);
  }, 15000);
});
