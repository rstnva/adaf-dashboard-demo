/**
 * Webhook Delivery Service
 * Fortune 500 Standard: Reliable delivery with retries, HMAC signing, circuit breaker
 */

import { createHmac } from 'crypto';
import type { WebhookConfig } from './config';
import type { AlertEvent } from './events';
import { formatWebhook } from './templates';

export interface DeliveryResult {
  success: boolean;
  webhook_name: string;
  attempts: number;
  error?: string;
  status_code?: number;
  duration_ms: number;
}

export class WebhookDelivery {
  private circuit_breaker: Map<string, { failures: number; last_failure: number }> = new Map();
  private readonly CIRCUIT_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_MS = 60000; // 1 minute

  /**
   * Deliver alert to all configured webhooks
   */
  async deliverAlert(event: AlertEvent, webhooks: WebhookConfig[]): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    for (const webhook of webhooks) {
      if (!webhook.enabled) continue;

      // Check if event type is enabled for this webhook
      if (!webhook.events[event.type]) continue;

      // Check severity filter
      if (webhook.filters?.min_severity) {
        const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
        if (severityLevels[event.severity] < severityLevels[webhook.filters.min_severity]) {
          continue;
        }
      }

      // Check feed filter
      if (webhook.filters?.feed_ids && !webhook.filters.feed_ids.includes(event.feedId)) {
        continue;
      }

      // Check circuit breaker
      if (this.isCircuitOpen(webhook.url)) {
        results.push({
          success: false,
          webhook_name: webhook.name,
          attempts: 0,
          error: 'Circuit breaker open',
          duration_ms: 0,
        });
        continue;
      }

      // Deliver with retries
      const result = await this.deliverWithRetries(event, webhook);
      results.push(result);

      // Update circuit breaker
      if (!result.success) {
        this.recordFailure(webhook.url);
      } else {
        this.resetCircuit(webhook.url);
      }
    }

    return results;
  }

  /**
   * Deliver to a single webhook with retry logic
   */
  private async deliverWithRetries(event: AlertEvent, webhook: WebhookConfig): Promise<DeliveryResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: string | undefined;
    let statusCode: number | undefined;

    const maxAttempts = webhook.retry.enabled ? webhook.retry.max_attempts : 1;

    for (let i = 0; i < maxAttempts; i++) {
      attempts++;

      try {
        const response = await this.sendWebhook(event, webhook);
        statusCode = response.status;

        if (response.ok) {
          return {
            success: true,
            webhook_name: webhook.name,
            attempts,
            status_code: statusCode,
            duration_ms: Date.now() - startTime,
          };
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      // Wait before retry (exponential backoff)
      if (i < maxAttempts - 1 && webhook.retry.enabled) {
        await this.sleep(webhook.retry.backoff_ms * Math.pow(2, i));
      }
    }

    return {
      success: false,
      webhook_name: webhook.name,
      attempts,
      error: lastError,
      status_code: statusCode,
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Send HTTP POST to webhook endpoint
   */
  private async sendWebhook(event: AlertEvent, webhook: WebhookConfig): Promise<Response> {
    const payload = formatWebhook(event, webhook.channel);
    const body = JSON.stringify(payload);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'ADAF-Oracle-Alerts/1.0',
    };

    // Add HMAC signature if secret is configured
    if (webhook.secret) {
      const signature = this.signPayload(body, webhook.secret);
      headers['X-Oracle-Signature'] = signature;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms);

    try {
      return await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: string, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Circuit breaker helpers
   */
  private isCircuitOpen(url: string): boolean {
    const circuit = this.circuit_breaker.get(url);
    if (!circuit) return false;

    // Reset circuit if cooldown period has passed
    if (Date.now() - circuit.last_failure > this.CIRCUIT_RESET_MS) {
      this.circuit_breaker.delete(url);
      return false;
    }

    return circuit.failures >= this.CIRCUIT_THRESHOLD;
  }

  private recordFailure(url: string): void {
    const circuit = this.circuit_breaker.get(url) || { failures: 0, last_failure: 0 };
    circuit.failures++;
    circuit.last_failure = Date.now();
    this.circuit_breaker.set(url, circuit);
  }

  private resetCircuit(url: string): void {
    this.circuit_breaker.delete(url);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const webhookDelivery = new WebhookDelivery();
