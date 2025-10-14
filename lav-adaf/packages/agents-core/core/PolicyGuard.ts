import type { SimulationRequest } from '@lav-adaf/integrations';
import type {
  RiskContext,
  RiskRuleEvaluation,
  RiskRules,
} from '@lav-adaf/wallet';

export interface PolicyGuardConfig {
  readonly allowlist: readonly string[];
  readonly slippageBpsLimit: number;
}

export interface PolicyDecision {
  readonly allowed: boolean;
  readonly violations: readonly RiskRuleEvaluation[];
}

export class PolicyGuard {
  private readonly config: PolicyGuardConfig;
  private readonly riskRules: RiskRules;

  constructor(riskRules: RiskRules, config: PolicyGuardConfig) {
    this.riskRules = riskRules;
    this.config = config;
  }

  enforce(request: SimulationRequest, context: RiskContext): PolicyDecision {
    const evaluations: RiskRuleEvaluation[] = [];

    evaluations.push(
      this.riskRules.evaluateSlippage({
        slippageBpsLimit: this.config.slippageBpsLimit,
        request,
      })
    );

    evaluations.push(
      this.riskRules.evaluateAllowlist({
        allowlist: this.config.allowlist,
        request,
      })
    );

    evaluations.push(
      this.riskRules.evaluateExposure({
        request,
        context,
      })
    );

    const violations = evaluations.filter(evaluation => !evaluation.passed);
    return {
      allowed: violations.length === 0,
      violations,
    };
  }
}
