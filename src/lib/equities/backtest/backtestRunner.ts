import type {
  EquitiesBacktestRequest,
  EquitiesBacktestResult,
} from '@/lib/equities/types';
import { getEquitiesRuntimeConfig } from '@/lib/equities/config';

export async function runEquitiesBacktest(
  request: EquitiesBacktestRequest
): Promise<EquitiesBacktestResult> {
  const runtime = getEquitiesRuntimeConfig();

  if (runtime.dryRun) {
    return {
      request,
      cagr: 0.12,
      sharpe: 1.4,
      maxDrawdown: -0.15,
      turnover: 1.8,
      equityCurve: [],
      benchmarkCurve: [],
      notes: 'Dry-run backtest placeholder. Replace with production-grade engine.',
    } satisfies EquitiesBacktestResult;
  }

  // TODO: Integrate with historical simulator (e.g., kdb+/Snowflake pipeline).
  return {
    request,
    cagr: null,
    sharpe: null,
    maxDrawdown: null,
    turnover: null,
    equityCurve: [],
    benchmarkCurve: [],
  } satisfies EquitiesBacktestResult;
}
