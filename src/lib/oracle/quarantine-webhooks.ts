/*
  Quarantine Webhooks helper (mock-first)
  - Sends quarantine alerts to a configured webhook URL (Slack or generic)
  - If no webhook is configured, operates in NOOP mode and returns ok:true, noop:true
  - Never performs real network calls in tests (fetch must be mocked)
*/

type Severity = 'info' | 'warning' | 'critical';

export interface QuarantineAlert {
  feedId: string;
  reason: string;
  severity?: Severity;
  details?: Record<string, unknown>;
}

export interface QuarantineAlertResult {
  ok: boolean;
  noop?: boolean;
  response?: string;
  payload?: Record<string, unknown>;
}

function isSlackWebhook(url: string): boolean {
  return /hooks\.slack\.com\/services\//.test(url);
}

function buildBasePayload(alert: QuarantineAlert) {
  const text = `⚠️ Oracle quarantine: ${alert.feedId} — ${alert.reason}`;
  const level = alert.severity ?? 'warning';
  const meta = {
    feedId: alert.feedId,
    reason: alert.reason,
    severity: level,
    ...(alert.details || {}),
  } as Record<string, unknown>;
  return { text, level, meta, ts: new Date().toISOString() };
}

function buildSlackPayload(base: ReturnType<typeof buildBasePayload>) {
  return {
    text: base.text,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `ADAF ${String(base.level).toUpperCase()}`,
        },
      },
      { type: 'section', text: { type: 'mrkdwn', text: base.text } },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `ts: ${base.ts}` }],
      },
      base.meta && Object.keys(base.meta).length > 0
        ? {
            type: 'section',
            fields: Object.entries(base.meta)
              .slice(0, 10)
              .map(([k, v]) => ({
                type: 'mrkdwn',
                text: `*${k}:* ${String(v)}`,
              })),
          }
        : undefined,
    ].filter(Boolean),
  } as Record<string, unknown>;
}

// Enhanced retry configuration (Fortune 500 pattern)
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// Generate HMAC signature for webhook payload
function generateHmacSignature(payload: string, secret: string): string {
  // TODO_REPLACE_WITH_REAL_DATA: Use crypto.createHmac when real webhooks enabled
  // For now, return mock signature
  return `mock-hmac-${payload.length}-${secret.slice(0, 4)}`;
}

// Exponential backoff delay
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

// Sleep helper for retries
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced webhook delivery with retries and HMAC
async function deliverWebhook(
  url: string,
  payload: Record<string, unknown>,
  hmacSecret?: string
): Promise<QuarantineAlertResult> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  // Add HMAC signature if secret provided
  if (hmacSecret) {
    headers['x-webhook-signature'] = generateHmacSignature(body, hmacSecret);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const text = await res.text().catch(() => '');

      if (res.ok) {
        return { ok: true, response: text.slice(0, 2000) };
      }

      // Don't retry on client errors (4xx)
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          response: `Client error ${res.status}: ${text.slice(0, 500)}`,
        };
      }

      // Retry on server errors (5xx)
      lastError = new Error(
        `Server error ${res.status}: ${text.slice(0, 500)}`
      );
    } catch (err) {
      lastError = err as Error;
    }

    // Wait before retry (except on last attempt)
    if (attempt < RETRY_CONFIG.maxRetries) {
      await sleep(getRetryDelay(attempt));
    }
  }

  return {
    ok: false,
    response: `Failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message || 'unknown'}`,
  };
}

// Channel routing based on severity (Fortune 500 pattern)
function getWebhookUrl(severity: Severity): string {
  const base =
    process.env.ALERT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || '';

  // TODO_REPLACE_WITH_REAL_DATA: Route to different channels by severity
  // Example: SLACK_CRITICAL_WEBHOOK, SLACK_WARNING_WEBHOOK, SLACK_INFO_WEBHOOK
  if (severity === 'critical' && process.env.SLACK_CRITICAL_WEBHOOK) {
    return process.env.SLACK_CRITICAL_WEBHOOK;
  }

  return base;
}

// Sends a quarantine alert to the configured webhook (if any)
export async function sendQuarantineAlert(
  alert: QuarantineAlert
): Promise<QuarantineAlertResult> {
  const severity = alert.severity ?? 'warning';
  const webhook = getWebhookUrl(severity);
  const base = buildBasePayload(alert);

  if (!webhook) {
    // NOOP when no webhook configured
    return { ok: true, noop: true, payload: base };
  }

  const body = isSlackWebhook(webhook) ? buildSlackPayload(base) : base;
  const hmacSecret = process.env.WEBHOOK_HMAC_SECRET;

  return deliverWebhook(webhook, body, hmacSecret);
}

// Convenience alias for compatibility with docs
export const quarantineAlert = sendQuarantineAlert;

// TODO_REPLACE_WITH_REAL_DATA: In production, route through an internal alerting service
// that applies rate limiting, retries, HMAC signing and channel routing.
