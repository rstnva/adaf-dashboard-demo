import type {
  OnChainPort,
  SimulationRequest,
  SimulationResult,
  ExecutionResult,
  AccountPosition,
} from '../../ports/OnChain';

/**
 * Placeholder para integración on-chain usando viem + wagmi.
 * Completar cuando se habilite USE_MOCKS=false y se configure RPC real.
 */
export class OnChainProvider implements OnChainPort {
  async simulate(_request: SimulationRequest): Promise<SimulationResult> {
    throw new Error(
      'OnChainProvider no implementado. Usa viem para simulaciones reales.'
    );
  }

  async execute(_request: SimulationRequest): Promise<ExecutionResult> {
    throw new Error(
      'OnChainProvider no implementado. Usa viem/wallet para ejecutar.'
    );
  }

  async getPositions(_address: string): Promise<readonly AccountPosition[]> {
    throw new Error(
      'OnChainProvider no implementado. Implementar lectura on-chain.'
    );
  }
}
