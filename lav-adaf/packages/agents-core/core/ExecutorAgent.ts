import { performance } from 'perf_hooks';
import type {
  AccountPosition,
  ExecutionResult,
  SimulationRequest,
} from '@lav-adaf/integrations';
import type {
  RiskContext,
  RiskRules,
  TxJournal,
  Wallet,
} from '@lav-adaf/wallet';
import type {
  AgentActionResult,
  AgentOptions,
  AgentPlan,
  PlanStep,
} from './Task';
import { BaseAgent } from './Agent';
import { PolicyGuard } from './PolicyGuard';

export interface ExecutorAgentConfig {
  readonly dryRun?: boolean;
}

interface ExecutorPayload {
  readonly request: SimulationRequest;
  readonly context: RiskContext;
  readonly mode?: 'simulate' | 'execute';
}

export class ExecutorAgent extends BaseAgent<ExecutionResult> {
  private readonly wallet: Wallet;
  private readonly policy: PolicyGuard;
  private readonly riskRules: RiskRules;
  private readonly journal: TxJournal;
  private readonly config: ExecutorAgentConfig;

  constructor(
    wallet: Wallet,
    policy: PolicyGuard,
    riskRules: RiskRules,
    journal: TxJournal,
    config: ExecutorAgentConfig,
    deps: ConstructorParameters<typeof BaseAgent>[2]
  ) {
    super('executor', 'ExecutorAgent', deps);
    this.wallet = wallet;
    this.policy = policy;
    this.riskRules = riskRules;
    this.journal = journal;
    this.config = config;
  }

  async plan(): Promise<never> {
    throw new Error('ExecutorAgent no genera planes');
  }

  async act(
    plan: AgentPlan,
    step: PlanStep,
    options?: AgentOptions
  ): Promise<AgentActionResult & { output: ExecutionResult }> {
    const payload = this.resolvePayload(step, options);
    const decision = this.policy.enforce(payload.request, payload.context);
    if (!decision.allowed) {
      this.markReport({
        agent: this.kind,
        summaries: ['PolicyGuard bloqueó la operación'],
        issues: decision.violations.map(
          violation => violation.message ?? violation.rule
        ),
        stats: { violations: decision.violations.length },
      });
      return {
        stepId: step.id,
        outcome: 'failed',
        message: 'PolicyGuard rejected execution',
        artifacts: { violations: decision.violations },
        startedAt: new Date(),
        finishedAt: new Date(),
        retries: 0,
        output: {
          success: false,
          gasUsed: BigInt(0),
          warnings: ['PolicyGuard rejection'],
        },
      };
    }

    const mode =
      payload.mode ??
      ((options?.dryRun ?? this.config.dryRun) ? 'simulate' : 'execute');
    const started = performance.now();
    const result =
      mode === 'execute'
        ? await this.wallet.execute(payload.request)
        : await this.wallet.simulate(payload.request);
    const ended = performance.now();
    this.metrics?.recordLatency(this.kind, mode, ended - started);

    this.journal.record({
      request: payload.request,
      result,
      violations: decision.violations,
    });

    this.markReport({
      agent: this.kind,
      summaries: [
        mode === 'execute' ? 'Operación ejecutada' : 'Simulación completada',
      ],
      issues: result.warnings?.filter(Boolean) ?? [],
      stats: {
        gasUsed: Number(result.gasUsed),
        warnings: result.warnings?.length ?? 0,
      },
      metadata: {
        mode,
        transactionHash: result.transactionHash,
      },
    });

    return {
      stepId: step.id,
      outcome: 'success',
      message: mode === 'execute' ? 'Execute OK' : 'Simulation OK',
      artifacts: {
        mode,
        transactionHash: result.transactionHash,
        warnings: result.warnings,
      },
      startedAt: new Date(performance.timeOrigin + started),
      finishedAt: new Date(performance.timeOrigin + ended),
      retries: 0,
      output: result,
    };
  }

  private resolvePayload(
    step: PlanStep,
    options?: AgentOptions
  ): ExecutorPayload {
    const source =
      (options?.payload &&
        (options.payload['executor'] as ExecutorPayload | undefined)) ??
      this.extractFromStep(step);
    if (!source) {
      throw new Error(`ExecutorAgent requiere payload (step ${step.id})`);
    }
    return source;
  }

  private extractFromStep(step: PlanStep): ExecutorPayload | undefined {
    const parameters = step.parameters ?? {};
    const request = parameters.request as SimulationRequest | undefined;
    const contextPartial = parameters.context as
      | (Partial<RiskContext> & { address?: string })
      | undefined;
    if (!request || !contextPartial?.address) {
      return undefined;
    }
    const positions = parameters.positions as
      | readonly AccountPosition[]
      | undefined;
    const positionSizeUsd = positions?.[0]?.balance
      ? Number(positions[0].balance)
      : 0;
    const context = this.riskRules.buildContext({
      address: contextPartial.address,
      portfolioValueUsd: contextPartial.portfolioValueUsd ?? positionSizeUsd,
      positionSizeUsd: contextPartial.positionSizeUsd ?? positionSizeUsd,
      ltv: contextPartial.ltv,
    });
    return {
      request,
      context,
      mode:
        (parameters.mode as 'simulate' | 'execute' | undefined) ?? undefined,
    };
  }
}
