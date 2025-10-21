import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface AdapterFixture {
  value: number;
  updatedAt: string;
  confidence?: number;
  confidenceInterval?: number;
  roundId?: string;
  priceId?: string;
  blockNumber?: number;
  blockHash?: string;
  txHash?: string;
  validatorCount?: number;
  deviationBps?: number;
  latencyMs?: number;
  quorumEligible?: boolean;
  disputeBond?: number;
  penalty?: number;
}

const cache = new Map<string, Record<string, AdapterFixture>>();

function resolveFixturePath(provider: string): string {
  return path.join(
    process.cwd(),
    'services',
    'oracle-core',
    'mock',
    'fixtures',
    'adapters',
    `${provider}.json`
  );
}

export async function loadAdapterFixture(provider: string, sourceId: string): Promise<AdapterFixture | null> {
  if (!cache.has(provider)) {
    const location = resolveFixturePath(provider);
    const raw = await readFile(location, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, AdapterFixture>;
    cache.set(provider, parsed);
  }

  const registry = cache.get(provider) ?? {};
  return registry[sourceId] ?? null;
}

export type { AdapterFixture };
