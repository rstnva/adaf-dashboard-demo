import type {
  AgentActionResult,
  AgentPlan,
  AgentReport,
  AgentOptions,
  Task,
} from './Task';
import type { PlannerAgent } from './PlannerAgent';
import type { CoderAgent, CoderOutput } from './CoderAgent';
import type { ReviewerAgent } from './ReviewerAgent';
import type { ExecutorAgent } from './ExecutorAgent';

export interface CoordinatorRunOptions {
  readonly dryRun?: boolean;
  readonly signal?: AbortSignal;
  readonly overrides?: Readonly<Record<string, unknown>>;
}

export interface StepExecutionRecord {
  readonly stepId: string;
  readonly assignee: string;
  readonly outcome: 'success' | 'failed';
  readonly result: AgentActionResult;
}

export interface CoordinatorResult {
  readonly plan: AgentPlan;
  readonly status: 'completed' | 'failed';
  readonly steps: readonly StepExecutionRecord[];
  readonly reports: readonly AgentReport[];
}

export class Coordinator {
  private readonly planner: PlannerAgent;
  private readonly coder: CoderAgent;
  private readonly reviewer: ReviewerAgent;
  private readonly executor: ExecutorAgent;

  constructor(
    planner: PlannerAgent,
    coder: CoderAgent,
    reviewer: ReviewerAgent,
    executor: ExecutorAgent
  ) {
    this.planner = planner;
    this.coder = coder;
    this.reviewer = reviewer;
    this.executor = executor;
  }

  async run(
    task: Task,
    options?: CoordinatorRunOptions
  ): Promise<CoordinatorResult> {
    const agentOptions: AgentOptions = {
      dryRun: options?.dryRun,
      signal: options?.signal,
    };

    const plan = await this.planner.plan(task, agentOptions);
    const steps: StepExecutionRecord[] = [];
    let lastCoderOutput: CoderOutput | undefined;

    for (const step of plan.steps) {
      if (options?.signal?.aborted) {
        throw new Error('Coordinator aborted by signal');
      }

      if (step.assignee === 'planner') {
        steps.push({
          stepId: step.id,
          assignee: step.assignee,
          outcome: 'success',
          result: {
            stepId: step.id,
            outcome: 'success',
            message: 'No-op planner step',
            artifacts: {},
            startedAt: new Date(),
            finishedAt: new Date(),
            retries: 0,
          },
        });
        continue;
      }

      if (step.assignee === 'coder') {
        const result = await this.coder.act(plan, step, agentOptions);
        lastCoderOutput = result.output;
        steps.push({
          stepId: step.id,
          assignee: step.assignee,
          outcome: result.outcome,
          result,
        });
        if (result.outcome !== 'success') {
          return this.summarize(plan, steps);
        }
        continue;
      }

      if (step.assignee === 'reviewer') {
        if (!lastCoderOutput) {
          throw new Error(`Reviewer step ${step.id} no tiene output del Coder`);
        }
        const result = await this.reviewer.act(plan, step, {
          ...agentOptions,
          candidate: lastCoderOutput,
        });
        steps.push({
          stepId: step.id,
          assignee: step.assignee,
          outcome: result.outcome,
          result,
        });
        if (result.outcome !== 'success' || !result.output.approved) {
          return this.summarize(plan, steps);
        }
        continue;
      }

      if (step.assignee === 'executor') {
        const overridePayload = options?.overrides
          ? (options.overrides['executor'] as
              | Record<string, unknown>
              | undefined)
          : undefined;
        const result = await this.executor.act(plan, step, {
          ...agentOptions,
          payload: overridePayload ? { executor: overridePayload } : undefined,
        });
        steps.push({
          stepId: step.id,
          assignee: step.assignee,
          outcome: result.outcome,
          result,
        });
        if (result.outcome !== 'success') {
          return this.summarize(plan, steps);
        }
        continue;
      }

      throw new Error(`Assignee ${step.assignee} no soportado`);
    }

    return this.summarize(plan, steps);
  }

  private summarize(
    plan: AgentPlan,
    steps: StepExecutionRecord[]
  ): CoordinatorResult {
    const status = steps.every(step => step.outcome === 'success')
      ? 'completed'
      : 'failed';
    return {
      plan,
      status,
      steps,
      reports: [
        this.planner.report(),
        this.coder.report(),
        this.reviewer.report(),
        this.executor.report(),
      ],
    };
  }
}
