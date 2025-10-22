/**
 * Webhook Alerting System - Configuration
 * Fortune 500 Standard: Multi-channel alerting for critical oracle events
 */

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  channel: 'slack' | 'discord' | 'teams' | 'generic';
  name: string;
  secret?: string; // For HMAC signing
  timeout_ms: number;
  retry: {
    enabled: boolean;
    max_attempts: number;
    backoff_ms: number;
  };
  events: {
    quorum_fail: boolean;
    stale_feed: boolean;
    rate_limit_violation: boolean;
    dq_quarantine: boolean;
    adapter_offline: boolean;
    consensus_timeout: boolean;
  };
  filters?: {
    min_severity?: 'low' | 'medium' | 'high' | 'critical';
    feed_ids?: string[]; // Only alert for specific feeds
  };
}

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enabled: false,
  url: '',
  channel: 'generic',
  name: 'Default Webhook',
  timeout_ms: 5000,
  retry: {
    enabled: true,
    max_attempts: 3,
    backoff_ms: 1000,
  },
  events: {
    quorum_fail: true,
    stale_feed: true,
    rate_limit_violation: false,
    dq_quarantine: true,
    adapter_offline: true,
    consensus_timeout: true,
  },
};

// Load webhooks from environment
export function loadWebhooksFromEnv(): WebhookConfig[] {
  const webhooks: WebhookConfig[] = [];

  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    webhooks.push({
      ...DEFAULT_WEBHOOK_CONFIG,
      enabled: true,
      url: process.env.SLACK_WEBHOOK_URL,
      channel: 'slack',
      name: 'Slack Alerts',
      secret: process.env.SLACK_WEBHOOK_SECRET,
    });
  }

  // Discord
  if (process.env.DISCORD_WEBHOOK_URL) {
    webhooks.push({
      ...DEFAULT_WEBHOOK_CONFIG,
      enabled: true,
      url: process.env.DISCORD_WEBHOOK_URL,
      channel: 'discord',
      name: 'Discord Alerts',
    });
  }

  // Teams
  if (process.env.TEAMS_WEBHOOK_URL) {
    webhooks.push({
      ...DEFAULT_WEBHOOK_CONFIG,
      enabled: true,
      url: process.env.TEAMS_WEBHOOK_URL,
      channel: 'teams',
      name: 'Teams Alerts',
    });
  }

  return webhooks;
}
