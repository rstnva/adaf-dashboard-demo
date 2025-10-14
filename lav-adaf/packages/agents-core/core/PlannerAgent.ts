import { randomUUID } from 'crypto';
import type { ModelRouter, RouteCompletionParams } from '@lav-adaf/ai-router';
import type {
  AgentPlan,
  AgentOptions,
  AgentReport,
  PlanMetric,
  PlanRisk,
  PlanStep,
  Task,
} from './Task';
import { BaseAgent } from './Agent';

export interface PlannerAgentConfig {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly promptOverride?: string;
}

interface RouterResponseShape {
  goal: string;
  steps: Array<{
    id?: string;
    title: string;
    description: string;
    assignee: 'planner' | 'coder' | 'reviewer' | 'executor';
    dependencies?: string[];
    acceptance?: string[];
    metrics?: Record<string, number>;
  }>;
  risks: Array<{
    id?: string;
    description: string;
    mitigation: string;
    owner: 'planner' | 'coder' | 'reviewer' | 'executor';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  metrics: Array<{
    id?: string;
    label: string;
    target: string;
    unit?: string;
  }>;
}

export class PlannerAgent extends BaseAgent {
  private readonly router: ModelRouter;
  private readonly config: PlannerAgentConfig;

  constructor(
    router: ModelRouter,
    config: PlannerAgentConfig,
    deps: ConstructorParameters<typeof BaseAgent>[2]
  ) {
    super('planner', 'PlannerAgent', deps);
    this.router = router;
    this.config = config;
  }

  async plan(task: Task, options?: AgentOptions): Promise<AgentPlan> {
    const started = process.hrtime.bigint();
    const prompt = this.buildPrompt(task);
    const params: RouteCompletionParams = {
      purpose: 'planning',
      input: prompt,
      temperature: this.config.temperature ?? 0.2,
      maxTokens: this.config.maxTokens ?? 1200,
      correlationId: options?.correlationId ?? task.id,
    };

    const result = await this.router.complete(params);

    const parsed = this.parsePlan(task, result.text);
    const plan: AgentPlan = {
      planId: randomUUID(),
      task,
      steps: parsed.steps,
      risks: parsed.risks,
      metrics: parsed.metrics,
      model: result.provider,
      createdAt: new Date(),
    };

    this.lastPlan = plan;
    const ended = process.hrtime.bigint();
    this.recordLatency('plan', started, ended);
    this.markReport({
      agent: this.kind,
      summaries: [`Plan generado con ${plan.steps.length} pasos`],
      issues: [],
      stats: {
        steps: plan.steps.length,
        risks: plan.risks.length,
        metrics: plan.metrics.length,
      },
      metadata: {
        provider: result.provider,
        latencyMs: result.latencyMs,
        correlationId: params.correlationId,
      },
    });
    return plan;
  }

  // PlannerAgent does not execute steps directly.
  async act(): Promise<never> {
    throw new Error(
      'PlannerAgent cannot execute plan steps. Delegate to Coder/Executor agents.'
    );
  }

  private buildPrompt(task: Task): string {
    if (this.config.promptOverride) {
      return this.config.promptOverride.replaceAll('{{GOAL}}', task.goal);
    }
    return [
      'You are the ADAF/LAV Planner Agent.',
      'Produce a deterministic JSON plan following the schema:',
      '{ goal, steps[], risks[], metrics[] }.',
      'Each step must include title, description, assignee, dependencies, acceptance.',
      'Use ONLY agents planner, coder, reviewer, executor.',
      'Do not invent connectors beyond ports/adapters described.',
      'Task context:',
      `goal: ${task.goal}`,
      `priority: ${task.priority}`,
      `risk: ${task.risk}`,
      task.description ? `description: ${task.description}` : '',
      task.tags.length ? `tags: ${task.tags.join(', ')}` : '',
      'Return valid JSON without markdown.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private parsePlan(
    task: Task,
    raw: string
  ): {
    steps: readonly PlanStep[];
    risks: readonly PlanRisk[];
    metrics: readonly PlanMetric[];
  } {
    let payload: RouterResponseShape;
    try {
      payload = JSON.parse(raw) as RouterResponseShape;
    } catch (error) {
      this.logger.warn(
        'PlannerAgent received non-JSON response, building fallback plan',
        {
          taskId: task.id,
          raw,
        }
      );
      payload = {
        goal: task.goal,
        steps: [
          {
            title: 'Clarify task context',
            description: 'Gather missing information before continuing.',
            assignee: 'planner',
            acceptance: ['Context documented'],
            dependencies: [],
          },
        ],
        risks: [
          {
            description: 'ModelRouter returned invalid JSON',
            mitigation: 'Fallback to default template',
            owner: 'planner',
            severity: 'medium',
          },
        ],
        metrics: [{ label: 'FallbackUsed', target: 'true', unit: 'boolean' }],
      };
    }

    const steps = payload.steps.map<PlanStep>((step, index) => ({
      id: step.id ?? `${task.id}-step-${index + 1}`,
      title: step.title,
      description: step.description,
      assignee: step.assignee,
      status: 'planning',
      dependencies: step.dependencies ?? [],
      acceptance: step.acceptance ?? [],
      metrics: step.metrics,
    }));

    const risks = payload.risks.map<PlanRisk>((risk, index) => ({
      id: risk.id ?? `${task.id}-risk-${index + 1}`,
      description: risk.description,
      mitigation: risk.mitigation,
      owner: risk.owner,
      severity: risk.severity,
    }));

    const metrics = payload.metrics.map<PlanMetric>((metric, index) => ({
      id: metric.id ?? `${task.id}-metric-${index + 1}`,
      label: metric.label,
      target: metric.target,
      unit: metric.unit,
    }));

    return { steps, risks, metrics };
  }

  report(): AgentReport {
    return super.report();
  }
}
