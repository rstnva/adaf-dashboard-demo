import type { Counter as CounterMetric } from 'prom-client';

import { dqEvaluationsTotal } from '../metrics/oracle.metrics';
import { getShadowRmseSnapshot } from './shadow-rmse';

interface CounterValue {
  labels: Record<string, string>;
  value: number;
}

async function getCounterValues(metric: CounterMetric) {
  const data = await metric.get();
  return data.values as CounterValue[];
}

type BasicStats = {
  pass: number;
  fail: number;
};

interface FeedStats extends BasicStats {
  rules: Map<string, BasicStats>;
}

interface Snapshot extends BasicStats {
  feeds: Map<string, FeedStats>;
}

export type TrendStatus = 'improving' | 'stable' | 'deteriorating';

export interface TrendInsight {
  status: TrendStatus;
  delta: {
    pass: number;
    fail: number;
    failureRatio: number;
  };
  recommendation: string;
}

let previousSnapshot: Snapshot | null = null;

export function resetDataQualitySummaryCache() {
  previousSnapshot = null;
}

export interface RuleEvaluationSummary {
  rule: string;
  pass: number;
  fail: number;
  total: number;
  failureRatio: number;
  severity: SeverityAssessment;
  trend: TrendInsight;
}

export interface FeedEvaluationSummary {
  feed: string;
  pass: number;
  fail: number;
  total: number;
  failureRatio: number;
  severity: SeverityAssessment;
  trend: TrendInsight;
  rules: RuleEvaluationSummary[];
  shadowRmse?: ShadowRmseInsight;
}

export interface DataQualitySummary {
  generatedAt: string;
  totals: {
    pass: number;
    fail: number;
    total: number;
    failureRatio: number;
    severity: SeverityAssessment;
    trend: TrendInsight;
    shadowRmse?: ShadowRmseInsight & { feeds: number };
  };
  feeds: FeedEvaluationSummary[];
}

export interface ShadowRmseInsight {
  rmse: number;
  baseline: number;
  samples: number;
  lastUpdated: string;
}

export type SeverityStatus = 'healthy' | 'warning' | 'critical';

export interface SeverityAssessment {
  status: SeverityStatus;
  recommendation: string;
}

function ratio(fail: number, total: number): number {
  if (total <= 0) return 0;
  return Number((fail / total).toFixed(6));
}

function assessTrend(current: BasicStats, previous?: BasicStats | null): TrendInsight {
  const currentTotal = current.pass + current.fail;
  const currentRatio = ratio(current.fail, currentTotal);

  if (!previous || (previous.pass === 0 && previous.fail === 0)) {
    return {
      status: 'stable',
      delta: {
        pass: 0,
        fail: 0,
        failureRatio: 0,
      },
      recommendation: 'Estable sin histórico previo; establecer línea base y continuar monitoreo.',
    };
  }

  const previousTotal = previous.pass + previous.fail;
  const previousRatio = ratio(previous.fail, previousTotal);

  const deltaPass = current.pass - previous.pass;
  const deltaFail = current.fail - previous.fail;
  const deltaRatio = Number((currentRatio - previousRatio).toFixed(6));

  let status: TrendStatus = 'stable';
  let recommendation = 'Sin cambios significativos; mantener vigilancia.';

  if (deltaRatio > 0.01 || deltaFail > 0) {
    status = 'deteriorating';
    recommendation = 'Investigar degradaciones recientes y ajustar guardrails.';
  } else if (deltaRatio < -0.01 && deltaFail <= 0) {
    status = 'improving';
    recommendation = 'Continuar mitigaciones vigentes y documentar aprendizajes.';
  }

  return {
    status,
    delta: {
      pass: deltaPass,
      fail: deltaFail,
      failureRatio: deltaRatio,
    },
    recommendation,
  };
}

function assessSeverity(fail: number, total: number): SeverityAssessment {
  const failureRatio = ratio(fail, total);

  if (fail >= 10 && failureRatio >= 0.2) {
    return {
      status: 'critical',
      recommendation: 'Escalar de inmediato, activar protocolo de incidentes y revisar feeds afectados.',
    };
  }

  if (fail >= 5 || failureRatio >= 0.05) {
    return {
      status: 'warning',
      recommendation: 'Revisar reglas fallidas en la próxima hora y preparar mitigación.',
    };
  }

  return {
    status: 'healthy',
    recommendation: 'Sin acciones urgentes, continuar monitoreo proactivo.',
  };
}

export interface DataQualitySummaryOptions {
  feedId?: string;
}

export async function getDataQualitySummary(
  options: DataQualitySummaryOptions = {}
): Promise<DataQualitySummary> {
  const values = await getCounterValues(dqEvaluationsTotal);
  const shadowSnapshot = getShadowRmseSnapshot(options.feedId);
  const shadowMap = new Map(shadowSnapshot.map(entry => [entry.feed, entry]));

  const feeds: Map<string, FeedStats> = new Map();

  for (const sample of values) {
    const feed = sample.labels.feed ?? 'unknown';
    if (options.feedId && options.feedId !== feed) continue;

    const rule = sample.labels.rule ?? 'unknown';
    const outcome = sample.labels.outcome ?? 'pass';
  const entry = feeds.get(feed) ?? { pass: 0, fail: 0, rules: new Map() };
  const ruleEntry = entry.rules.get(rule) ?? { pass: 0, fail: 0 };

    if (outcome === 'fail') {
      entry.fail += sample.value;
      ruleEntry.fail += sample.value;
    } else {
      entry.pass += sample.value;
      ruleEntry.pass += sample.value;
    }

    entry.rules.set(rule, ruleEntry);
    feeds.set(feed, entry);
  }

  let totalPass = 0;
  let totalFail = 0;

  const previous = previousSnapshot;

  const feedSummaries: FeedEvaluationSummary[] = Array.from(feeds.entries()).map(([feed, data]) => {
    totalPass += data.pass;
    totalFail += data.fail;

    const previousFeed = previous?.feeds.get(feed) ?? null;
    const shadow = shadowMap.get(feed) ?? null;

    const ruleSummaries: RuleEvaluationSummary[] = Array.from(data.rules.entries()).map(([rule, ruleData]) => {
      const ruleTotal = ruleData.pass + ruleData.fail;
      const previousRule = previousFeed?.rules.get(rule) ?? null;
      return {
        rule,
        pass: ruleData.pass,
        fail: ruleData.fail,
        total: ruleTotal,
        failureRatio: ratio(ruleData.fail, ruleTotal),
        severity: assessSeverity(ruleData.fail, ruleTotal),
        trend: assessTrend(ruleData, previousRule),
      };
    });

    const total = data.pass + data.fail;
    return {
      feed,
      pass: data.pass,
      fail: data.fail,
      total,
      failureRatio: ratio(data.fail, total),
      severity: assessSeverity(data.fail, total),
      trend: assessTrend(data, previousFeed),
      rules: ruleSummaries.sort((a, b) => b.failureRatio - a.failureRatio || b.total - a.total),
      shadowRmse: shadow
        ? {
            rmse: shadow.rmse,
            baseline: shadow.baseline,
            samples: shadow.samples,
            lastUpdated: shadow.lastUpdated,
          }
        : undefined,
    };
  });

  feedSummaries.sort((a, b) => b.failureRatio - a.failureRatio || b.total - a.total);

  const total = totalPass + totalFail;
  const totalsTrend = assessTrend(
    { pass: totalPass, fail: totalFail },
    previous ? { pass: previous.pass, fail: previous.fail } : null
  );

  const aggregateShadow = shadowSnapshot.length
    ? {
        rmse: Number(
          (
            shadowSnapshot.reduce((acc, entry) => acc + entry.rmse, 0) /
            shadowSnapshot.length
          ).toFixed(6)
        ),
        baseline: Number(
          (
            shadowSnapshot.reduce((acc, entry) => acc + entry.baseline, 0) /
            shadowSnapshot.length
          ).toFixed(6)
        ),
        samples: shadowSnapshot.reduce((acc, entry) => acc + entry.samples, 0),
        lastUpdated: shadowSnapshot
          .slice()
          .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))[0]?.lastUpdated ?? new Date().toISOString(),
        feeds: shadowSnapshot.length,
      }
    : undefined;

  previousSnapshot = captureSnapshot(feeds, { pass: totalPass, fail: totalFail });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      pass: totalPass,
      fail: totalFail,
      total,
      failureRatio: ratio(totalFail, total),
      severity: assessSeverity(totalFail, total),
      trend: totalsTrend,
      shadowRmse: aggregateShadow,
    },
    feeds: feedSummaries,
  };
}

function captureSnapshot(feeds: Map<string, FeedStats>, totals: BasicStats): Snapshot {
  const feedEntries: Map<string, FeedStats> = new Map();

  for (const [feed, data] of feeds.entries()) {
    const ruleEntries: Map<string, BasicStats> = new Map();
    for (const [rule, ruleData] of data.rules.entries()) {
      ruleEntries.set(rule, { pass: ruleData.pass, fail: ruleData.fail });
    }
    feedEntries.set(feed, {
      pass: data.pass,
      fail: data.fail,
      rules: ruleEntries,
    });
  }

  return {
    pass: totals.pass,
    fail: totals.fail,
    feeds: feedEntries,
  };
}
