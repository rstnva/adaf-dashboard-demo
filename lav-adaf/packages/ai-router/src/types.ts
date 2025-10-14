export type RoutingPurpose = 'planning' | 'coding' | 'reviewing' | 'fallback';

export interface RouteCompletionParams {
  readonly purpose: RoutingPurpose;
  readonly input: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CompletionUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface CompletionResult {
  readonly text: string;
  readonly provider: string;
  readonly latencyMs: number;
  readonly cached: boolean;
  readonly usage?: CompletionUsage;
}

export interface RouterTelemetry {
  recordSuccess(
    provider: string,
    purpose: RoutingPurpose,
    latencyMs: number
  ): void;
  recordFailure(
    provider: string,
    purpose: RoutingPurpose,
    error: unknown
  ): void;
  recordCacheHit(provider: string, purpose: RoutingPurpose): void;
}

export interface RouterCache {
  get(key: string): CompletionResult | undefined;
  set(key: string, result: CompletionResult): void;
}
