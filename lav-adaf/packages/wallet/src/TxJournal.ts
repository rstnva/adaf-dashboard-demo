import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import type {
  ExecutionResult,
  SimulationRequest,
} from '@lav-adaf/integrations';
import type { RiskRuleEvaluation } from './types';

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

export interface TxJournalConfig {
  readonly databasePath?: string;
}

export interface TxJournalEntry {
  readonly id: string;
  readonly request: SimulationRequest;
  readonly result: ExecutionResult;
  readonly violations: readonly RiskRuleEvaluation[];
  readonly createdAt: Date;
}

export class TxJournal {
  private readonly entries: TxJournalEntry[] = [];
  private readonly db?: InstanceType<NonNullable<typeof SqliteDatabase>>;

  constructor(config?: TxJournalConfig) {
    if (config?.databasePath && SqliteDatabase) {
      this.db = new SqliteDatabase(config.databasePath);
      this.db.exec(`CREATE TABLE IF NOT EXISTS tx_journal (
        id TEXT PRIMARY KEY,
        request TEXT NOT NULL,
        result TEXT NOT NULL,
        violations TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`);
    }
  }

  record(entry: Omit<TxJournalEntry, 'id' | 'createdAt'>): TxJournalEntry {
    const fullEntry: TxJournalEntry = {
      id: randomUUID(),
      createdAt: new Date(),
      ...entry,
    };
    this.entries.push(fullEntry);
    if (this.db) {
      const statement = this.db.prepare(
        'INSERT INTO tx_journal (id, request, result, violations, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      statement.run(
        fullEntry.id,
        JSON.stringify(fullEntry.request),
        JSON.stringify(fullEntry.result),
        JSON.stringify(fullEntry.violations),
        fullEntry.createdAt.toISOString()
      );
    }
    return fullEntry;
  }

  list(): readonly TxJournalEntry[] {
    return this.entries;
  }
}
