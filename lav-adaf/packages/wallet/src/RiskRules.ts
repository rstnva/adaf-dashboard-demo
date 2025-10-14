import type {
  AllowlistEvaluationInput,
  ExposureEvaluationInput,
  RiskContext,
  RiskRuleEvaluation,
  SlippageEvaluationInput,
} from './types';

export class RiskRules {
  evaluateSlippage(input: SlippageEvaluationInput): RiskRuleEvaluation {
    const slippage = input.request.slippageBps ?? 0;
    const passed = slippage <= input.slippageBpsLimit;
    return {
      rule: 'slippage_bps',
      passed,
      severity: passed ? 'low' : 'high',
      message: passed
        ? undefined
        : `Slippage ${slippage}bps excede límite ${input.slippageBpsLimit}bps`,
    };
  }

  evaluateAllowlist(input: AllowlistEvaluationInput): RiskRuleEvaluation {
    const destination = input.request.to.toLowerCase();
    const allowed = input.allowlist.some(
      address => address.toLowerCase() === destination
    );
    return {
      rule: 'allowlist',
      passed: allowed,
      severity: allowed ? 'low' : 'critical',
      message: allowed
        ? undefined
        : `Destino ${input.request.to} no está en allowlist`,
    };
  }

  evaluateExposure(input: ExposureEvaluationInput): RiskRuleEvaluation {
    const { context } = input;
    const maxLtv = 0.7; // 70 % LTV objetivo
    const ltv = context.ltv ?? 0;
    const positionLimit = context.portfolioValueUsd * 0.2; // 20 % del portafolio
    const violations: string[] = [];

    if (ltv > maxLtv) {
      violations.push(`LTV ${ltv.toFixed(2)} > ${maxLtv.toFixed(2)}`);
    }
    if (context.positionSizeUsd > positionLimit) {
      violations.push(
        `Position ${context.positionSizeUsd.toFixed(2)} USD excede límite ${positionLimit.toFixed(2)} USD`
      );
    }

    return {
      rule: 'exposure',
      passed: violations.length === 0,
      severity: violations.length > 0 ? 'high' : 'low',
      message: violations.join('; ') || undefined,
    };
  }

  buildContext(
    partial: Partial<RiskContext> & { address: string }
  ): RiskContext {
    return {
      address: partial.address,
      portfolioValueUsd: partial.portfolioValueUsd ?? 0,
      positionSizeUsd: partial.positionSizeUsd ?? 0,
      ltv: partial.ltv,
    };
  }
}
