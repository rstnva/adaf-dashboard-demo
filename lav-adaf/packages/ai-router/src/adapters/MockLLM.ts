import type { CompletionResult, RouteCompletionParams } from '../types';
import type { LLM, CompletionOptions } from '../ports/LLM';

export interface MockLLMConfig {
  readonly responses?: Partial<
    Record<RouteCompletionParams['purpose'], string>
  >;
  readonly latencyMs?: number;
}

export class MockLLM implements LLM {
  readonly id = 'mock';
  readonly metadata = {
    provider: 'mock',
    model: 'mock-1.0',
    maxTokens: 4096,
    supportsTools: false,
  } as const;

  private readonly responses: Partial<
    Record<RouteCompletionParams['purpose'], string>
  >;
  private readonly latencyMs: number;

  constructor(config?: MockLLMConfig) {
    this.responses = config?.responses ?? {};
    this.latencyMs = config?.latencyMs ?? 5;
  }

  async complete(
    prompt: string,
    _options: CompletionOptions,
    params: RouteCompletionParams
  ): Promise<CompletionResult> {
    const response =
      this.responses[params.purpose] ?? this.defaultResponse(params, prompt);
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    return {
      text: response,
      provider: this.metadata.provider,
      latencyMs: this.latencyMs,
      cached: false,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((prompt.length + response.length) / 4),
      },
    };
  }

  async healthcheck(): Promise<boolean> {
    return true;
  }

  private defaultResponse(
    params: RouteCompletionParams,
    prompt: string
  ): string {
    switch (params.purpose) {
      case 'planning':
        return JSON.stringify(
          {
            goal: 'Mock plan',
            steps: [
              {
                title: 'Analyze requirements',
                description: 'Review prompt and clarify TODOs.',
                assignee: 'planner',
                dependencies: [],
                acceptance: ['Requirements documented'],
              },
              {
                title: 'Implement changes',
                description: 'Produce necessary code modifications.',
                assignee: 'coder',
                dependencies: ['step-1'],
                acceptance: ['All tests written'],
              },
              {
                title: 'Review',
                description: 'Validate code, tests, security.',
                assignee: 'reviewer',
                dependencies: ['step-2'],
                acceptance: ['Checklist satisfied'],
              },
              {
                title: 'Simulate execution',
                description: 'Run executor in dry-run mode.',
                assignee: 'executor',
                dependencies: ['step-3'],
                acceptance: ['Simulation success'],
              },
            ],
            risks: [
              {
                description: 'Mock LLM fallback',
                mitigation: 'Use deterministic template',
                owner: 'planner',
                severity: 'low',
              },
            ],
            metrics: [
              { label: 'Simulation', target: 'pass' },
              { label: 'Tests', target: 'pass' },
            ],
          },
          null,
          2
        );
      case 'coding':
        return JSON.stringify(
          {
            files: [
              {
                path: 'README.md',
                action: 'update',
                language: 'markdown',
                content: `<!-- mock change -->\n${prompt.slice(0, 120)}`,
              },
            ],
            tests: ['pnpm test'],
            summary: 'Mock coder output',
          },
          null,
          2
        );
      case 'reviewing':
        return JSON.stringify(
          {
            approved: true,
            findings: [],
            testsRequired: [],
          },
          null,
          2
        );
      default:
        return JSON.stringify({ message: 'mock' });
    }
  }
}
