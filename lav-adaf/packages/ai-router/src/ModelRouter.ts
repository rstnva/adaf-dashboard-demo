import { createHash } from 'crypto';
import { performance } from 'perf_hooks';
import type { LLM } from './ports/LLM';
import type {
  CompletionResult,
  RouteCompletionParams,
  RouterCache,
  RouterTelemetry,
} from './types';

export interface ModelRouterOptions {
  readonly providers: Record<string, LLM>;
  readonly fallbackOrder?: Record<string, readonly string[]>;
  readonly cache?: RouterCache;
  readonly telemetry?: RouterTelemetry;
  readonly defaultTemperature?: number;
}

const DEFAULT_ORDER: Record<string, readonly string[]> = {
  planning: ['openai', 'anthropic', 'gemini', 'mistral', 'grok', 'mock'],
  coding: ['mistral', 'openai', 'deepseek', 'mock'],
  reviewing: ['anthropic', 'openai', 'gemini', 'mock'],
  fallback: ['mock'],
};

export class ModelRouter {
  private readonly providers: Map<string, LLM>;
  private readonly options: ModelRouterOptions;

  constructor(options: ModelRouterOptions) {
    this.providers = new Map<string, LLM>(Object.entries(options.providers));
    this.options = options;
  }

  register(id: string, provider: LLM): void {
    this.providers.set(id, provider);
  }

  async complete(params: RouteCompletionParams): Promise<CompletionResult> {
    const order = this.resolveOrder(params.purpose);
    const cacheKey = this.buildCacheKey(params);
    if (this.options.cache) {
      const cached = this.options.cache.get(cacheKey);
      if (cached) {
        this.options.telemetry?.recordCacheHit(cached.provider, params.purpose);
        return cached;
      }
    }

    const errors: Array<{ provider: string; error: unknown }> = [];
    for (const providerId of order) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        continue;
      }

      try {
        const started = performance.now();
        const result = await provider.complete(
          params.input,
          {
            temperature:
              params.temperature ?? this.options.defaultTemperature ?? 0,
            maxTokens: params.maxTokens,
            metadata: params.metadata,
          },
          params
        );
        const ended = performance.now();
        this.options.telemetry?.recordSuccess(
          providerId,
          params.purpose,
          ended - started
        );
        const enriched: CompletionResult = {
          ...result,
          cached: false,
        };
        this.options.cache?.set(cacheKey, enriched);
        return enriched;
      } catch (error) {
        errors.push({ provider: providerId, error });
        this.options.telemetry?.recordFailure(
          providerId,
          params.purpose,
          error
        );
        continue;
      }
    }

    const message = `ModelRouter: no provider succeeded for purpose "${params.purpose}". Errors: ${errors
      .map(
        ({ provider, error }) =>
          `${provider}: ${(error as Error).message ?? error}`
      )
      .join('; ')}`;
    throw new Error(message);
  }

  private resolveOrder(purpose: string): readonly string[] {
    const custom = this.options.fallbackOrder?.[purpose];
    if (custom && custom.length > 0) {
      return custom;
    }
    return DEFAULT_ORDER[purpose] ?? DEFAULT_ORDER.fallback;
  }

  private buildCacheKey(params: RouteCompletionParams): string {
    const hash = createHash('sha256');
    hash.update(params.purpose);
    hash.update(params.input);
    if (params.temperature !== undefined) {
      hash.update(String(params.temperature));
    }
    if (params.maxTokens !== undefined) {
      hash.update(String(params.maxTokens));
    }
    if (params.metadata) {
      hash.update(JSON.stringify(params.metadata));
    }
    return hash.digest('hex');
  }
}
