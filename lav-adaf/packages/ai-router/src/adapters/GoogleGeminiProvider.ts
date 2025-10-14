import { performance } from 'perf_hooks';
import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface GoogleGeminiProviderConfig {
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
}

export class GoogleGeminiProvider implements LLM {
  readonly id = 'gemini';
  readonly metadata;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config?: GoogleGeminiProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.GOOGLE_API_KEY;
    this.baseUrl =
      config?.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    const model =
      config?.model ??
      process.env.GOOGLE_GEMINI_MODEL ??
      'models/gemini-1.5-pro';
    this.metadata = {
      provider: 'gemini',
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
      throw new Error('Google Gemini API key missing. Set GOOGLE_API_KEY.');
    }

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? params.temperature ?? 0,
        maxOutputTokens: options.maxTokens ?? params.maxTokens ?? 1600,
      },
    };

    const started = performance.now();
    const response = await fetch(
      `${this.baseUrl}/${this.metadata.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Gemini error: ${response.status} ${response.statusText} - ${error}`
      );
    }
    const ended = performance.now();
    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return {
      text,
      provider: this.metadata.provider,
      latencyMs: ended - started,
      cached: false,
      usage: json.usageMetadata
        ? {
            promptTokens: json.usageMetadata.promptTokenCount,
            completionTokens: json.usageMetadata.candidatesTokenCount,
            totalTokens: json.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }
}
