import { describe, expect, it } from 'vitest';
import { ModelRouter } from '../src/ModelRouter';
import { MockLLM } from '../src/adapters/MockLLM';
import type { LLM, CompletionOptions } from '../src/ports/LLM';
import type { RouteCompletionParams, CompletionResult } from '../src/types';

class FailingProvider implements LLM {
  readonly id = 'failing';
  readonly metadata = {
    provider: 'failing',
    model: 'broken',
    maxTokens: 1,
    supportsTools: false,
  } as const;

  async complete(): Promise<CompletionResult> {
    throw new Error('Provider down');
  }
}

class EchoProvider extends MockLLM {
  async complete(
    prompt: string,
    _options: CompletionOptions,
    params: RouteCompletionParams
  ): Promise<CompletionResult> {
    const base = await super.complete(prompt, _options, params);
    return { ...base, text: 'echo' };
  }
}

describe('ModelRouter', () => {
  it('falls back to secondary provider when primary errors', async () => {
    const router = new ModelRouter({
      providers: {
        failing: new FailingProvider(),
        mock: new EchoProvider(),
      },
      fallbackOrder: {
        planning: ['failing', 'mock'],
        fallback: ['mock'],
      },
    });

    const result = await router.complete({
      purpose: 'planning',
      input: 'test',
      maxTokens: 10,
    });

    expect(result.text).toBe('echo');
    expect(result.provider).toBe('mock');
  });
});
