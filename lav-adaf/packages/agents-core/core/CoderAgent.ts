import { performance } from 'perf_hooks';
import type { ModelRouter, RouteCompletionParams } from '@lav-adaf/ai-router';
import type {
  AgentActionResult,
  AgentOptions,
  AgentPlan,
  AgentReport,
  PlanStep,
} from './Task';
import { BaseAgent } from './Agent';

export interface CoderOutput {
  readonly files: readonly CodeChange[];
  readonly tests: readonly string[];
  readonly summary: string;
}

export interface CodeChange {
  readonly path: string;
  readonly action: 'create' | 'update' | 'delete';
  readonly language: string;
  readonly content: string;
}

export interface CoderAgentConfig {
  readonly temperature?: number;
  readonly maxTokens?: number;
}

interface RouterCoderPayload {
  files: Array<{
    path: string;
    action: 'create' | 'update' | 'delete';
    language: string;
    content: string;
  }>;
  tests: string[];
  summary: string;
}

export class CoderAgent extends BaseAgent<CoderOutput> {
  private readonly router: ModelRouter;
  private readonly config: CoderAgentConfig;

  constructor(
    router: ModelRouter,
    config: CoderAgentConfig,
    deps: ConstructorParameters<typeof BaseAgent>[2]
  ) {
    super('coder', 'CoderAgent', deps);
    this.router = router;
    this.config = config;
  }

  async plan(): Promise<never> {
    throw new Error(
      'CoderAgent does not generate global plans. Use PlannerAgent first.'
    );
  }

  async act(
    plan: AgentPlan,
    step: PlanStep,
    options?: AgentOptions
  ): Promise<AgentActionResult & { output: CoderOutput }> {
    const startTime = performance.now();
    const params: RouteCompletionParams = {
      purpose: 'coding',
      input: this.buildPrompt(plan, step),
      temperature: this.config.temperature ?? 0.1,
      maxTokens: this.config.maxTokens ?? 1600,
      correlationId: options?.correlationId ?? `${plan.planId}:${step.id}`,
    };

    const completion = await this.router.complete(params);
    const payload = this.parsePayload(plan.planId, step.id, completion.text);

    const ended = performance.now();
    this.metrics?.recordLatency(this.kind, 'act', ended - startTime);
    this.metrics?.increment(this.kind, 'code_suggestions');

    const startDate = new Date(performance.timeOrigin + startTime);
    const endDate = new Date(performance.timeOrigin + ended);
    const result: AgentActionResult & { output: CoderOutput } = {
      stepId: step.id,
      outcome: 'success',
      message: 'Code suggestions generated',
      artifacts: {
        provider: completion.provider,
        tests: payload.tests,
      },
      startedAt: startDate,
      finishedAt: endDate,
      retries: 0,
      output: payload,
    };

    this.markReport({
      agent: this.kind,
      summaries: [payload.summary],
      issues: [],
      stats: {
        files: payload.files.length,
      },
      metadata: {
        provider: completion.provider,
      },
    });

    return result;
  }

  report(): AgentReport<CoderOutput> {
    return super.report();
  }

  private buildPrompt(plan: AgentPlan, step: PlanStep): string {
    return [
      'Eres el CoderAgent de ADAF/LAV.',
      'Lee el plan y genera cambios mínimos respetando interfaces existentes.',
      'Responde JSON con { files[], tests[], summary }.',
      'No uses any; usa TypeScript estricto.',
      'Incluye pruebas Vitest/Playwright según corresponda.',
      'Plan:',
      JSON.stringify(
        {
          goal: plan.task.goal,
          step: {
            id: step.id,
            title: step.title,
            description: step.description,
            acceptance: step.acceptance,
          },
          previousSteps: plan.steps
            .filter(({ id }) => id !== step.id)
            .map(({ id, title, status }) => ({ id, title, status })),
        },
        null,
        2
      ),
    ].join('\n');
  }

  private parsePayload(
    planId: string,
    stepId: string,
    raw: string
  ): CoderOutput {
    try {
      const parsed = JSON.parse(raw) as RouterCoderPayload;
      const files = parsed.files.map<CodeChange>(file => ({
        path: file.path,
        action: file.action,
        language: file.language,
        content: file.content,
      }));
      return {
        files,
        tests: parsed.tests,
        summary: parsed.summary,
      };
    } catch (error) {
      this.logger.error('CoderAgent failed to parse router response', {
        planId,
        stepId,
        raw,
        error,
      });
      return {
        files: [],
        tests: [],
        summary: 'Router returned invalid JSON. Manual intervention required.',
      };
    }
  }
}
