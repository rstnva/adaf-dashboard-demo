import { performance } from 'perf_hooks';
import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface XaiGrokProviderConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
}

export class XaiGrokProvider implements LLM {
  readonly id = 'grok';
  readonly metadata;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config?: XaiGrokProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.XAI_API_KEY;
    this.baseUrl = config?.baseUrl ?? 'https://api.x.ai/v1';
    const model = config?.model ?? process.env.XAI_MODEL ?? 'grok-2-latest';
    this.metadata = {
      provider: 'grok',
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
      throw new Error('xAI Grok API key missing. Set XAI_API_KEY.');
    }

    const body = {
      model: this.metadata.model,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      temperature: options.temperature ?? params.temperature ?? 0,
      max_output_tokens: options.maxTokens ?? params.maxTokens ?? 1500,
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
      throw new Error(`xAI error: ${response.statusText} - ${error}`);
    }
    const ended = performance.now();
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: Array<{ text?: string }> } }>;
    };

    const text =
      json.choices?.[0]?.message?.content?.find(
        content => typeof content.text === 'string'
      )?.text ?? '';

    return {
      text,
      provider: this.metadata.provider,
      latencyMs: ended - started,
      cached: false,
    };
  }
}
