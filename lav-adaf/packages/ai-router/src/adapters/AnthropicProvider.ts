import { performance } from 'perf_hooks';
import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface AnthropicProviderConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
}

export class AnthropicProvider implements LLM {
  readonly id = 'anthropic';
  readonly metadata;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config?: AnthropicProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.ANTHROPIC_API_KEY;
    this.baseUrl = config?.baseUrl ?? 'https://api.anthropic.com/v1';
    const model =
      config?.model ??
      process.env.ANTHROPIC_MODEL ??
      'claude-3-5-sonnet-20241022';
    this.metadata = {
      provider: 'anthropic',
      model,
      maxTokens: 16_000,
      supportsTools: true,
    } as const;
  }

  async complete(
    prompt: string,
    options: CompletionOptions,
    params: RouteCompletionParams
  ): Promise<CompletionResult> {
    if (!this.apiKey) {
      throw new Error(
        'Anthropic API key missing. Set ANTHROPIC_API_KEY or configure the provider.'
      );
    }

    const body = {
      model: this.metadata.model,
      max_tokens: options.maxTokens ?? params.maxTokens ?? 1500,
      temperature: options.temperature ?? params.temperature ?? 0,
      system:
        'You are the ADAF/LAV reviewer/coder planner. Produce concise deterministic output.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const started = performance.now();
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic error: ${response.statusText} - ${error}`);
    }
    const ended = performance.now();
    const json = (await response.json()) as {
      content: Array<{ text?: string }>;
      usage?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    };

    const text = json.content?.[0]?.text ?? '';
    return {
      text,
      provider: this.metadata.provider,
      latencyMs: ended - started,
      cached: false,
      usage: json.usage
        ? {
            promptTokens: json.usage.input_tokens,
            completionTokens: json.usage.output_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
    };
  }
}
