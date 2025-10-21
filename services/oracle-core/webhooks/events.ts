/**
 * Webhook Alert Event Types
 * Fortune 500 Standard: Structured alert payloads
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertEventType =
  | 'quorum_fail'
  | 'stale_feed'
  | 'rate_limit_violation'
  | 'dq_quarantine'
  | 'adapter_offline'
  | 'consensus_timeout';

export interface AlertEvent {
  id: string; // Unique alert ID
  type: AlertEventType;
  severity: AlertSeverity;
  feedId: string;
  message: string;
  details: Record<string, any>;
  timestamp: string; // ISO 8601
  environment: string; // production, staging, etc.
}

export interface QuorumFailEvent extends AlertEvent {
  type: 'quorum_fail';
  details: {
    required: number;
    actual: number;
    sources_failed: string[];
    last_successful: string; // ISO timestamp
  };
}

export interface StaleFeedEvent extends AlertEvent {
  type: 'stale_feed';
  details: {
    ttl_ms: number;
    last_update: string; // ISO timestamp
    age_ms: number;
  };
}

export interface RateLimitEvent extends AlertEvent {
  type: 'rate_limit_violation';
  details: {
    client_id?: string;
    endpoint: string;
    limit: number;
    actual: number;
    window_ms: number;
  };
}

export interface DQQuarantineEvent extends AlertEvent {
  type: 'dq_quarantine';
  details: {
    signal_id: string;
    value: number;
    expected_range: { min: number; max: number };
    z_score: number;
    rule_violated: string;
  };
}

export interface AdapterOfflineEvent extends AlertEvent {
  type: 'adapter_offline';
  details: {
    adapter: string;
    last_heartbeat: string; // ISO timestamp
    consecutive_failures: number;
  };
}

export interface ConsensusTimeoutEvent extends AlertEvent {
  type: 'consensus_timeout';
  details: {
    timeout_ms: number;
    actual_ms: number;
    sources_pending: string[];
  };
}
