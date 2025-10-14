import type {
  AgentActionResult,
  AgentKind,
  AgentObservation,
  AgentOptions,
  AgentPlan,
  AgentReport,
  PlanStep,
  Task,
} from './Task';

export interface AgentLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface AgentMetrics {
  recordLatency(agent: AgentKind, operation: string, elapsedMs: number): void;
  increment(
    agent: AgentKind,
    metric: string,
    tags?: Record<string, string>
  ): void;
}

export interface AgentDependencies {
  logger: AgentLogger;
  metrics?: AgentMetrics;
}

export interface Agent<TOutput = unknown> {
  readonly kind: AgentKind;
  readonly name: string;
  plan(task: Task, options?: AgentOptions): Promise<AgentPlan>;
  act(
    plan: AgentPlan,
    step: PlanStep,
    options?: AgentOptions
  ): Promise<AgentActionResult & { output?: TOutput }>;
  observe(observation: AgentObservation, options?: AgentOptions): Promise<void>;
  report(): AgentReport<TOutput>;
}

export abstract class BaseAgent<TOutput = unknown> implements Agent<TOutput> {
  readonly kind: AgentKind;
  readonly name: string;
  protected readonly logger: AgentLogger;
  protected readonly metrics?: AgentMetrics;
  protected lastPlan: AgentPlan | null = null;
  protected lastReport: AgentReport<TOutput>;

  protected constructor(
    kind: AgentKind,
    name: string,
    deps: AgentDependencies
  ) {
    this.kind = kind;
    this.name = name;
    this.logger = deps.logger;
    this.metrics = deps.metrics;
    this.lastReport = {
      agent: kind,
      summaries: [],
      issues: [],
      stats: {},
    };
  }

  abstract plan(task: Task, options?: AgentOptions): Promise<AgentPlan>;

  abstract act(
    plan: AgentPlan,
    step: PlanStep,
    options?: AgentOptions
  ): Promise<AgentActionResult & { output?: TOutput }>;

  async observe(observation: AgentObservation): Promise<void> {
    this.logger.debug(`${this.name} observation`, {
      agent: this.kind,
      observation,
    });
  }

  report(): AgentReport<TOutput> {
    return this.lastReport;
  }

  protected markReport(report: AgentReport<TOutput>): void {
    this.lastReport = report;
  }

  protected recordLatency(operation: string, start: bigint, end: bigint): void {
    const elapsedMs = Number(end - start) / 1_000_000;
    this.metrics?.recordLatency(this.kind, operation, elapsedMs);
  }
}
