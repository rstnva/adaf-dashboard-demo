import type { CompletionResult, RouteCompletionParams } from '../types';

export interface LLMMetadata {
  readonly provider: string;
  readonly model: string;
  readonly maxTokens: number;
  readonly supportsTools: boolean;
}

export interface CompletionOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly stop?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LLM {
  readonly id: string;
  readonly metadata: LLMMetadata;
  complete(
    prompt: string,
    options: CompletionOptions,
    params: RouteCompletionParams
  ): Promise<CompletionResult>;
  healthcheck?(): Promise<boolean>;
}
