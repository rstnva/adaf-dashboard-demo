/**
 * Prometheus metrics exporter for Oracle Core
 * Exposes all oracle metrics in Prometheus text format
 */

import { register } from 'prom-client';

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export async function getMetricsContentType(): Promise<string> {
  return register.contentType;
}

export function resetMetrics(): void {
  register.resetMetrics();
}
