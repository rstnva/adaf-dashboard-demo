import type {
  EquitiesProviderContext,
  EquityProvider,
} from '@/lib/equities/types';
import { getEquitiesRuntimeConfig } from '@/lib/equities/config';

export type ProviderHealthStatus = 'ok' | 'degraded' | 'error';

export interface ProviderHealth {
  key: string;
  status: ProviderHealthStatus;
  message?: string;
  checkedAt: string;
}

export abstract class BaseEquityProvider<TArgs, TResult>
  implements EquityProvider<TArgs, TResult>
{
  abstract key: string;
  abstract description: string;
  abstract supportedMarkets: string[];

  async fetch(
    args: TArgs,
    context: EquitiesProviderContext
  ): Promise<TResult> {
    const runtime = getEquitiesRuntimeConfig();
    const now = context.now ?? (() => new Date());
    const envelope: EquitiesProviderContext = {
      dryRun: runtime.dryRun,
      cacheTtlMs: runtime.cacheTtlMs,
      abortSignal: context.abortSignal,
      now,
    };

    return this.handleFetch(args, envelope);
  }

  protected abstract handleFetch(
    _args: TArgs,
    _context: EquitiesProviderContext
  ): Promise<TResult>;

  async health(): Promise<ProviderHealth> {
    return {
      key: this.key,
      status: 'ok',
      message: 'Health check not implemented yet',
      checkedAt: new Date().toISOString(),
    };
  }
}

export function withDryRunFallback<TResult>(
  providerKey: string,
  dryRunFactory: () => TResult
) {
  return async (
    execute: () => Promise<TResult>,
    context: EquitiesProviderContext
  ): Promise<TResult> => {
    if (context.dryRun) {
      return Promise.resolve(dryRunFactory());
    }

    try {
      return await execute();
    } catch (error) {
      console.warn(
        `[EquitiesProvider:${providerKey}] Execution failed, returning dry-run payload`,
        error
      );
      return dryRunFactory();
    }
  };
}
