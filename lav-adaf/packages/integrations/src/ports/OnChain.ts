export interface AccountPosition {
  readonly address: string;
  readonly asset: string;
  readonly balance: bigint;
  readonly chainId: number;
}

export interface SimulationRequest {
  readonly from: string;
  readonly to: string;
  readonly data: string;
  readonly value?: bigint;
  readonly slippageBps?: number;
}

export interface SimulationResult {
  readonly success: boolean;
  readonly gasUsed: bigint;
  readonly returnData?: string;
  readonly warnings: readonly string[];
}

export interface ExecutionResult extends SimulationResult {
  readonly transactionHash?: string;
  readonly nonce?: bigint;
}

export interface OnChainPort {
  simulate(request: SimulationRequest): Promise<SimulationResult>;
  execute(request: SimulationRequest): Promise<ExecutionResult>;
  getPositions(address: string): Promise<readonly AccountPosition[]>;
}

export interface LedgerEvent {
  readonly id: string;
  readonly type: 'simulate' | 'execute';
  readonly payload: SimulationRequest;
  readonly result: SimulationResult;
  readonly createdAt: Date;
}
