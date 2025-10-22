import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendQuarantineAlert } from '@/lib/oracle/quarantine-webhooks';

describe('quarantine-webhooks', () => {
  const OLD_ENV = { ...process.env } as NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.SLACK_WEBHOOK_URL;
  });

  it('returns NOOP when no webhook configured', async () => {
    // override fetch in tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = vi.fn();

    const res = await sendQuarantineAlert({
      feedId: 'price/btc_usd.live',
      reason: 'quorum_fail',
    });
    expect(res.ok).toBe(true);
    expect(res.noop).toBe(true);
    expect(res.payload).toBeDefined();
    expect(res.payload?.text).toContain('Oracle quarantine');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends Slack-formatted payload when Slack webhook URL configured', async () => {
    process.env.ALERT_WEBHOOK_URL =
      'https://hooks.slack.com/services/T000/B000/XXXX';

    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => 'ok' });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/eth_usd.live',
      reason: 'stale_persist',
      severity: 'critical',
    });

    expect(res.ok).toBe(true);
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe(process.env.ALERT_WEBHOOK_URL);
    const opts = call[1];
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.blocks).toBeDefined();
    expect(Array.isArray(body.blocks)).toBe(true);
    // Header block contains ADAF CRITICAL
    const header = body.blocks.find((b: any) => b.type === 'header');
    expect(header.text.text).toContain('ADAF CRITICAL');
  });

  it('sends generic JSON payload when non-Slack webhook configured', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';

    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => 'accepted' });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/sol_usd.live',
      reason: 'dq_quarantine',
      severity: 'warning',
    });
    expect(res.ok).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain('Oracle quarantine');
    expect(body.level).toBe('warning');
    expect(body.meta.feedId).toBe('price/sol_usd.live');
  });

  it('returns ok:false on non-2xx response', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: false, text: async () => 'error' });
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/aave_usd.live',
      reason: 'confidence_low',
    });
    expect(res.ok).toBe(false);
  });

  it('handles network errors gracefully', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook';
    const mockFetch = vi.fn().mockRejectedValue(new Error('network down'));
    (global as any).fetch = mockFetch;

    const res = await sendQuarantineAlert({
      feedId: 'price/btc_usd.live',
      reason: 'rate_limit',
    });
    expect(res.ok).toBe(false);
    expect(res.response).toContain('network down');
  });
});
