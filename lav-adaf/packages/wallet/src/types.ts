import type { SimulationRequest } from '@lav-adaf/integrations';

export type Hex = `0x${string}`;

export interface RiskContext {
  readonly portfolioValueUsd: number;
  readonly positionSizeUsd: number;
  readonly ltv?: number;
  readonly address: string;
}

export interface RiskRuleEvaluation {
  readonly rule: string;
  readonly passed: boolean;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message?: string;
}

export interface SlippageEvaluationInput {
  readonly slippageBpsLimit: number;
  readonly request: SimulationRequest;
}

export interface AllowlistEvaluationInput {
  readonly allowlist: readonly string[];
  readonly request: SimulationRequest;
}

export interface ExposureEvaluationInput {
  readonly context: RiskContext;
  readonly request: SimulationRequest;
}

export interface WalletConfig {
  readonly dryRun: boolean;
}

export interface WalletSignatureRequest {
  readonly domain: Record<string, unknown>;
  readonly types: Record<string, Array<{ name: string; type: string }>>;
  readonly message: Record<string, unknown>;
}
