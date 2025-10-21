/**
 * Webhook Message Templates
 * Fortune 500 Standard: Rich formatting for Slack, Discord, Teams
 */

import type { AlertEvent } from './events';

export interface SlackPayload {
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
  attachments?: Array<{
    color: string;
    fields: Array<{ title: string; value: string; short?: boolean }>;
    footer?: string;
    ts?: number;
  }>;
}

export interface DiscordPayload {
  content: string;
  embeds?: Array<{
    title: string;
    description: string;
    color: number;
    fields: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp: string;
    footer?: { text: string };
  }>;
}

const SEVERITY_COLORS = {
  low: '#0066CC', // Blue
  medium: '#FFA500', // Orange
  high: '#FF6600', // Dark Orange
  critical: '#CC0000', // Red
};

const SLACK_COLORS = {
  low: '#36a64f', // Green
  medium: '#ff9900', // Orange
  high: '#ff6600', // Dark Orange
  critical: '#d00000', // Red
};

const DISCORD_COLORS = {
  low: 0x36a64f,
  medium: 0xff9900,
  high: 0xff6600,
  critical: 0xd00000,
};

const EVENT_ICONS = {
  quorum_fail: '❌',
  stale_feed: '⏰',
  rate_limit_violation: '🚦',
  dq_quarantine: '⚠️',
  adapter_offline: '📡',
  consensus_timeout: '⏱️',
};

export function formatForSlack(event: AlertEvent): SlackPayload {
  const icon = EVENT_ICONS[event.type];
  const color = SLACK_COLORS[event.severity];

  const fields: Array<{ title: string; value: string; short: boolean }> = [
    { title: 'Feed ID', value: `\`${event.feedId}\``, short: true },
    { title: 'Severity', value: event.severity.toUpperCase(), short: true },
    { title: 'Environment', value: event.environment, short: true },
    { title: 'Time', value: new Date(event.timestamp).toLocaleString(), short: true },
  ];

  // Add type-specific details
  Object.entries(event.details).forEach(([key, value]) => {
    fields.push({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      short: typeof value !== 'object',
    });
  });

  return {
    text: `${icon} *Oracle Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}*`,
    attachments: [
      {
        color,
        fields,
        footer: `Oracle Core Alert System • ID: ${event.id}`,
        ts: Math.floor(new Date(event.timestamp).getTime() / 1000),
      },
    ],
  };
}

export function formatForDiscord(event: AlertEvent): DiscordPayload {
  const icon = EVENT_ICONS[event.type];
  const color = DISCORD_COLORS[event.severity];

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: 'Feed ID', value: `\`${event.feedId}\``, inline: true },
    { name: 'Severity', value: event.severity.toUpperCase(), inline: true },
    { name: 'Environment', value: event.environment, inline: true },
  ];

  // Add type-specific details
  Object.entries(event.details).forEach(([key, value]) => {
    fields.push({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: typeof value === 'object' ? `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`` : String(value),
      inline: typeof value !== 'object',
    });
  });

  return {
    content: `${icon} **Oracle Alert**`,
    embeds: [
      {
        title: event.type.replace(/_/g, ' ').toUpperCase(),
        description: event.message,
        color,
        fields,
        timestamp: event.timestamp,
        footer: { text: `Alert ID: ${event.id}` },
      },
    ],
  };
}

export function formatForTeams(event: AlertEvent): any {
  const icon = EVENT_ICONS[event.type];
  const color = SEVERITY_COLORS[event.severity];

  const facts = [
    { name: 'Feed ID', value: event.feedId },
    { name: 'Severity', value: event.severity.toUpperCase() },
    { name: 'Environment', value: event.environment },
    { name: 'Time', value: new Date(event.timestamp).toLocaleString() },
  ];

  // Add type-specific details
  Object.entries(event.details).forEach(([key, value]) => {
    facts.push({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    });
  });

  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `${icon} Oracle Alert: ${event.type}`,
    themeColor: color.replace('#', ''),
    title: `${icon} Oracle Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}`,
    text: event.message,
    sections: [
      {
        facts,
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View in Dashboard',
        targets: [
          {
            os: 'default',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/oracle`,
          },
        ],
      },
    ],
  };
}

export function formatWebhook(event: AlertEvent, channel: 'slack' | 'discord' | 'teams' | 'generic'): any {
  switch (channel) {
    case 'slack':
      return formatForSlack(event);
    case 'discord':
      return formatForDiscord(event);
    case 'teams':
      return formatForTeams(event);
    case 'generic':
    default:
      return event; // Return raw event for generic webhooks
  }
}
