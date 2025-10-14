import { performance } from 'perf_hooks';
import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface MistralProviderConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
}

export class MistralProvider implements LLM {
  readonly id = 'mistral';
  readonly metadata;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config?: MistralProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.MISTRAL_API_KEY;
    this.baseUrl = config?.baseUrl ?? 'https://api.mistral.ai/v1';
    const model =
      config?.model ?? process.env.MISTRAL_MODEL ?? 'codestral-latest';
    this.metadata = {
      provider: 'mistral',
      model,
      maxTokens: 32_000,
      supportsTools: true,
    } as const;
  }

  async complete(
    prompt: string,
    options: CompletionOptions,
    params: RouteCompletionParams
  ): Promise<CompletionResult> {
    if (!this.apiKey) {
      throw new Error('Mistral API key missing. Set MISTRAL_API_KEY.');
    }

    const body = {
      model: this.metadata.model,
      max_tokens: options.maxTokens ?? params.maxTokens ?? 1600,
      temperature: options.temperature ?? params.temperature ?? 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const started = performance.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral error: ${response.statusText} - ${error}`);
    }
    const ended = performance.now();
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const text = json.choices?.[0]?.message?.content ?? '';
    return {
      text,
      provider: this.metadata.provider,
      latencyMs: ended - started,
      cached: false,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
    };
  }
}
