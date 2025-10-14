import { performance } from 'perf_hooks';
import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface OpenAIProviderConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly organization?: string;
}

export class OpenAIProvider implements LLM {
  readonly id = 'openai';
  readonly metadata;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly organization?: string;

  constructor(config?: OpenAIProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY;
    this.baseUrl = config?.baseUrl ?? 'https://api.openai.com/v1';
    this.organization = config?.organization ?? process.env.OPENAI_ORG;
    const model = config?.model ?? process.env.OPENAI_MODEL ?? 'o1-preview';
    this.metadata = {
      provider: 'openai',
      model,
      maxTokens: 16_384,
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
        'OpenAI API key missing. Set OPENAI_API_KEY or configure the provider.'
      );
    }

    const body = {
      model: this.metadata.model,
      input: prompt,
      temperature: options.temperature ?? params.temperature ?? 0,
      max_output_tokens: options.maxTokens ?? params.maxTokens ?? 1500,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const started = performance.now();
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `OpenAI error: ${response.status} ${response.statusText} - ${error}`
      );
    }
    const ended = performance.now();
    const json = (await response.json()) as {
      output: Array<{ content: Array<{ text?: string }> }>;
      usage?: {
        prompt_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    };
    const text = json.output?.[0]?.content?.[0]?.text ?? '';
    return {
      text,
      provider: this.metadata.provider,
      latencyMs: ended - started,
      cached: false,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.output_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
    };
  }
}
