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
import type { CoderOutput } from './CoderAgent';

export interface ReviewFinding {
  readonly type: 'blocking' | 'warning' | 'info';
  readonly message: string;
  readonly path?: string;
}

export interface ReviewerOutput {
  readonly approved: boolean;
  readonly findings: readonly ReviewFinding[];
  readonly testsRequired: readonly string[];
}

export interface ReviewerAgentConfig {
  readonly temperature?: number;
  readonly maxTokens?: number;
}

interface RouterReviewerPayload {
  approved: boolean;
  findings: Array<{
    type: 'blocking' | 'warning' | 'info';
    message: string;
    path?: string;
  }>;
  testsRequired: string[];
}

export class ReviewerAgent extends BaseAgent<ReviewerOutput> {
  private readonly router: ModelRouter;
  private readonly config: ReviewerAgentConfig;

  constructor(
    router: ModelRouter,
    config: ReviewerAgentConfig,
    deps: ConstructorParameters<typeof BaseAgent>[2]
  ) {
    super('reviewer', 'ReviewerAgent', deps);
    this.router = router;
    this.config = config;
  }

  async plan(): Promise<never> {
    throw new Error('ReviewerAgent does not generate plans.');
  }

  async act(
    plan: AgentPlan,
    step: PlanStep,
    options?: AgentOptions & { candidate?: CoderOutput }
  ): Promise<AgentActionResult & { output: ReviewerOutput }> {
    if (!options?.candidate) {
      throw new Error(
        'ReviewerAgent requires candidate output from CoderAgent.'
      );
    }

    const start = performance.now();
    const params: RouteCompletionParams = {
      purpose: 'reviewing',
      input: this.buildPrompt(plan, step, options.candidate),
      temperature: this.config.temperature ?? 0,
      maxTokens: this.config.maxTokens ?? 800,
      correlationId:
        options.correlationId ?? `${plan.planId}:${step.id}:review`,
    };

    const completion = await this.router.complete(params);
    const payload = this.parsePayload(plan.planId, step.id, completion.text);

    const end = performance.now();
    this.metrics?.recordLatency(this.kind, 'act', end - start);
    this.metrics?.increment(
      this.kind,
      payload.approved ? 'reviews_approved' : 'reviews_rejected'
    );

    const report: AgentActionResult & { output: ReviewerOutput } = {
      stepId: step.id,
      outcome: 'success',
      message: payload.approved
        ? 'Cambios aprobados'
        : 'Cambios requieren ajustes',
      artifacts: {
        provider: completion.provider,
        findings: payload.findings,
      },
      startedAt: new Date(performance.timeOrigin + start),
      finishedAt: new Date(performance.timeOrigin + end),
      retries: 0,
      output: payload,
    };

    this.markReport({
      agent: this.kind,
      summaries: [
        payload.approved
          ? 'Reviewer aprobó los cambios'
          : `Reviewer encontró ${payload.findings.length} hallazgos`,
      ],
      issues: payload.findings
        .filter(finding => finding.type === 'blocking')
        .map(finding => finding.message),
      stats: {
        findings: payload.findings.length,
      },
      metadata: {
        provider: completion.provider,
      },
    });

    return report;
  }

  report(): AgentReport<ReviewerOutput> {
    return super.report();
  }

  private buildPrompt(
    plan: AgentPlan,
    step: PlanStep,
    candidate: CoderOutput
  ): string {
    return [
      'Eres el ReviewerAgent (seguridad + confiabilidad).',
      'Evalúa el cambio propuesto y devuelve JSON { approved, findings[], testsRequired[] }.',
      'Checklist: tipos, errores, seguridad, límites (slippage/LTV), cobertura de tests, logs, secretos.',
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
        },
        null,
        2
      ),
      'Candidate:',
      JSON.stringify(candidate, null, 2),
    ].join('\n');
  }

  private parsePayload(
    planId: string,
    stepId: string,
    raw: string
  ): ReviewerOutput {
    try {
      const parsed = JSON.parse(raw) as RouterReviewerPayload;
      return {
        approved: parsed.approved,
        findings: parsed.findings,
        testsRequired: parsed.testsRequired,
      };
    } catch (error) {
      this.logger.error('ReviewerAgent recibió JSON inválido', {
        planId,
        stepId,
        raw,
        error,
      });
      return {
        approved: false,
        findings: [
          {
            type: 'blocking',
            message:
              'LLM devolvió respuesta inválida. Reintentar o revisar manualmente.',
          },
        ],
        testsRequired: [],
      };
    }
  }
}
