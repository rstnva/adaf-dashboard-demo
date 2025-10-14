import { createHash, randomUUID } from 'crypto';
import { createRequire } from 'module';
import type {
  OnChainPort,
  SimulationRequest,
  SimulationResult,
  ExecutionResult,
  AccountPosition,
  LedgerEvent,
} from '../../ports/OnChain';

const require = createRequire(import.meta.url);
let SqliteDatabase:
  | undefined
  | (new (path: string) => {
      prepare(sql: string): {
        run(...params: unknown[]): void;
        all<T = unknown>(...params: unknown[]): T[];
      };
      exec(sql: string): void;
      close(): void;
    });

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SqliteDatabase = require('better-sqlite3');
} catch {
  SqliteDatabase = undefined;
}

export interface OnChainMockConfig {
  readonly databasePath?: string;
  readonly chainId?: number;
  readonly dryRun?: boolean;
}

interface LedgerRecord {
  readonly id: string;
  readonly type: 'simulate' | 'execute';
  readonly payload: SimulationRequest;
  readonly result: SimulationResult;
  readonly createdAt: Date;
}

export class OnChainMock implements OnChainPort {
  private readonly balances = new Map<string, bigint>();
  private readonly events: LedgerRecord[] = [];
  private readonly config: OnChainMockConfig;
  private readonly db?: InstanceType<NonNullable<typeof SqliteDatabase>>;
  private readonly chainId: number;

  constructor(config?: OnChainMockConfig) {
    this.config = config ?? {};
    this.chainId = config?.chainId ?? 8453; // Base mainnet default
    if (config?.databasePath && SqliteDatabase) {
      this.db = new SqliteDatabase(config.databasePath);
      this.db.exec(`CREATE TABLE IF NOT EXISTS ledger (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`);
    }
  }

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const gasUsed = BigInt(50_000 + Math.floor(Math.random() * 20_000));
    const warnings: string[] = [];

    if (request.slippageBps !== undefined && request.slippageBps > 50) {
      warnings.push(`Slippage ${request.slippageBps}bps exceeds 0.5% policy.`);
    }

    const result: SimulationResult = {
      success: warnings.length === 0,
      gasUsed,
      warnings,
      returnData: this.hashRequest(request),
    };

    this.persistEvent('simulate', request, result);
    return result;
  }

  async execute(request: SimulationRequest): Promise<ExecutionResult> {
    const simulation = await this.simulate(request);
    if (!simulation.success) {
      return { ...simulation, transactionHash: undefined };
    }

    if (this.config.dryRun ?? false) {
      return {
        ...simulation,
        transactionHash: `dry-run-${randomUUID()}`,
        nonce: this.deriveNonce(request.from),
      };
    }

    this.applyLedgerMutation(request);
    const execution: ExecutionResult = {
      ...simulation,
      transactionHash: `0x${this.hashRequest(request)}`,
      nonce: this.deriveNonce(request.from),
    };

    this.persistEvent('execute', request, execution);
    return execution;
  }

  async getPositions(address: string): Promise<readonly AccountPosition[]> {
    const key = this.keyFor(address);
    const balance = this.balances.get(key) ?? BigInt(0);
    return [
      {
        address,
        asset: 'ETH',
        balance,
        chainId: this.chainId,
      },
    ];
  }

  getLedger(): readonly LedgerEvent[] {
    return this.events;
  }

  private applyLedgerMutation(request: SimulationRequest): void {
    const senderKey = this.keyFor(request.from);
    const receiverKey = this.keyFor(request.to);
    const value = request.value ?? BigInt(0);

    const senderBalance =
      this.balances.get(senderKey) ?? BigInt(10) ** BigInt(19);
    if (senderBalance < value) {
      throw new Error('Insufficient balance in mock ledger');
    }

    this.balances.set(senderKey, senderBalance - value);
    const receiverBalance = this.balances.get(receiverKey) ?? BigInt(0);
    this.balances.set(receiverKey, receiverBalance + value);
  }

  private persistEvent(
    type: 'simulate' | 'execute',
    payload: SimulationRequest,
    result: SimulationResult
  ): void {
    const record: LedgerRecord = {
      id: randomUUID(),
      type,
      payload,
      result,
      createdAt: new Date(),
    };
    this.events.push(record);
    if (this.db) {
      const statement = this.db.prepare(
        'INSERT INTO ledger (id, type, payload, result, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      statement.run(
        record.id,
        type,
        JSON.stringify(payload),
        JSON.stringify(result),
        record.createdAt.toISOString()
      );
    }
  }

  private keyFor(address: string): string {
    return address.toLowerCase();
  }

  private hashRequest(request: SimulationRequest): string {
    const hash = createHash('sha256');
    hash.update(request.from);
    hash.update(request.to);
    hash.update(request.data);
    if (request.value) {
      hash.update(request.value.toString(16));
    }
    return hash.digest('hex');
  }

  private deriveNonce(address: string): bigint {
    const hash = createHash('md5');
    hash.update(address.toLowerCase());
    return BigInt(`0x${hash.digest('hex')}`) % BigInt(1_000_000);
  }
}
