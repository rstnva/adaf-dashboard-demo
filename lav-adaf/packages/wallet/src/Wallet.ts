import { randomUUID } from 'crypto';
import type {
  ExecutionResult,
  OnChainPort,
  SimulationRequest,
  SimulationResult,
} from '@lav-adaf/integrations';
import type { Hex, WalletConfig, WalletSignatureRequest } from './types';

export interface Wallet {
  readonly address: string;
  simulate(request: SimulationRequest): Promise<SimulationResult>;
  execute(request: SimulationRequest): Promise<ExecutionResult>;
  signTypedData(request: WalletSignatureRequest): Promise<Hex>;
}

export class EvmWallet implements Wallet {
  readonly address: string;
  private readonly onChain: OnChainPort;
  private readonly config: WalletConfig;

  constructor(address: string, onChain: OnChainPort, config: WalletConfig) {
    this.address = address;
    this.onChain = onChain;
    this.config = config;
  }

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    return this.onChain.simulate(request);
  }

  async execute(request: SimulationRequest): Promise<ExecutionResult> {
    if (this.config.dryRun) {
      const simulation = await this.simulate(request);
      return {
        ...simulation,
        transactionHash: `dry-run-${randomUUID()}`,
        nonce: BigInt(Date.now()),
      };
    }
    return this.onChain.execute(request);
  }

  async signTypedData(request: WalletSignatureRequest): Promise<Hex> {
    const payload = JSON.stringify(request);
    const buffer = Buffer.from(payload, 'utf8');
    return `0x${buffer.toString('hex').slice(0, 64).padEnd(64, '0')}` as Hex;
  }
}
