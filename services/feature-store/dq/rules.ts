/**
 * Feature Store - Data Quality Rules
 *
 * Enforces data quality standards for feature data:
 * - Coverage: Minimum data availability
 * - Freshness: Maximum staleness (TTL)
 * - Range: Expected value bounds
 * - Outliers: Statistical anomaly detection
 *
 * Fortune 500 Standards:
 * - Fail-fast on critical violations
 * - Warn on minor violations
 * - Audit trail of all violations
 * - Configurable thresholds
 *
 * @module services/feature-store/dq/rules
 */

import { FeaturePoint, FeatureSpec } from '../schema/zod';
import { getFeatureStats } from '../storage/pg';

/**
 * DQ violation severity
 */
export type ViolationSeverity = 'critical' | 'warning' | 'info';

/**
 * DQ violation
 */
export interface DQViolation {
  featureId: string;
  rule: string;
  severity: ViolationSeverity;
  message: string;
  value?: number;
  expected?: number | [number, number];
  ts: string;
}

/**
 * DQ check result
 */
export interface DQCheckResult {
  featureId: string;
  passed: boolean;
  violations: DQViolation[];
  checkedAt: string;
}

/**
 * Check coverage (data availability)
 *
 * Verifies that feature has sufficient data points.
 *
 * @param featureId - Feature ID
 * @param spec - Feature specification
 * @param minCoverage - Minimum coverage ratio (0.0 to 1.0)
 * @returns DQ check result
 */
export async function checkCoverage(
  featureId: string,
  spec: FeatureSpec,
  minCoverage: number = 0.8
): Promise<DQCheckResult> {
  const violations: DQViolation[] = [];

  try {
    const stats = await getFeatureStats(featureId);

    // Calculate expected points based on frequency
    const frequencyMs: Record<string, number> = {
      tick: 1000, // Approximate
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    if (stats.oldest_ts && stats.newest_ts) {
      const start = new Date(stats.oldest_ts).getTime();
      const end = new Date(stats.newest_ts).getTime();
      const duration = end - start;

      const expectedPoints = Math.floor(duration / frequencyMs[spec.frequency]);
      const actualPoints = stats.count;
      const coverage = expectedPoints > 0 ? actualPoints / expectedPoints : 0;

      if (coverage < minCoverage) {
        violations.push({
          featureId,
          rule: 'coverage',
          severity: coverage < 0.5 ? 'critical' : 'warning',
          message: `Coverage ${(coverage * 100).toFixed(1)}% below threshold ${(minCoverage * 100).toFixed(1)}%`,
          value: coverage,
          expected: minCoverage,
          ts: new Date().toISOString(),
        });
      }
    } else if (stats.count === 0) {
      violations.push({
        featureId,
        rule: 'coverage',
        severity: 'critical',
        message: 'No data points found',
        value: 0,
        expected: minCoverage,
        ts: new Date().toISOString(),
      });
    }
  } catch (error) {
    violations.push({
      featureId,
      rule: 'coverage',
      severity: 'critical',
      message: `Coverage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ts: new Date().toISOString(),
    });
  }

  return {
    featureId,
    passed: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Check freshness (staleness)
 *
 * Verifies that latest data point is within TTL.
 *
 * @param point - Latest feature point
 * @param spec - Feature specification
 * @param maxStalenessRatio - Maximum staleness as ratio of TTL (default: 1.5)
 * @returns DQ check result
 */
export function checkFreshness(
  point: FeaturePoint | null,
  spec: FeatureSpec,
  maxStalenessRatio: number = 1.5
): DQCheckResult {
  const violations: DQViolation[] = [];

  if (!point) {
    violations.push({
      featureId: spec.id,
      rule: 'freshness',
      severity: 'critical',
      message: 'No data point available',
      ts: new Date().toISOString(),
    });
  } else {
    const now = Date.now();
    const pointTime = new Date(point.ts).getTime();
    const age = now - pointTime;
    const maxAge = spec.ttl_ms * maxStalenessRatio;

    if (age > maxAge) {
      const ageSec = Math.floor(age / 1000);
      const maxAgeSec = Math.floor(maxAge / 1000);

      violations.push({
        featureId: spec.id,
        rule: 'freshness',
        severity: age > spec.ttl_ms * 3 ? 'critical' : 'warning',
        message: `Data is ${ageSec}s old, exceeds TTL threshold ${maxAgeSec}s`,
        value: ageSec,
        expected: maxAgeSec,
        ts: new Date().toISOString(),
      });
    }
  }

  return {
    featureId: spec.id,
    passed: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Check value range
 *
 * Verifies that value is within expected bounds.
 *
 * @param point - Feature point
 * @param spec - Feature specification
 * @returns DQ check result
 */
export function checkRange(
  point: FeaturePoint,
  spec: FeatureSpec
): DQCheckResult {
  const violations: DQViolation[] = [];

  if (spec.quality?.expected_range) {
    const [min, max] = spec.quality.expected_range;

    if (point.value < min) {
      violations.push({
        featureId: spec.id,
        rule: 'range',
        severity: 'warning',
        message: `Value ${point.value} below expected minimum ${min}`,
        value: point.value,
        expected: [min, max],
        ts: point.ts,
      });
    } else if (point.value > max) {
      violations.push({
        featureId: spec.id,
        rule: 'range',
        severity: 'warning',
        message: `Value ${point.value} above expected maximum ${max}`,
        value: point.value,
        expected: [min, max],
        ts: point.ts,
      });
    }
  }

  // Check for NaN/Infinity
  if (!isFinite(point.value)) {
    violations.push({
      featureId: spec.id,
      rule: 'range',
      severity: 'critical',
      message: `Invalid value: ${point.value}`,
      value: point.value,
      ts: point.ts,
    });
  }

  return {
    featureId: spec.id,
    passed: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Check for outliers using z-score method
 *
 * Detects statistical anomalies in recent data.
 *
 * @param points - Recent feature points (sliding window)
 * @param spec - Feature specification
 * @param threshold - Z-score threshold (default: 3.0)
 * @returns DQ check result
 */
export function checkOutliers(
  points: FeaturePoint[],
  spec: FeatureSpec,
  threshold: number = 3.0
): DQCheckResult {
  const violations: DQViolation[] = [];

  if (points.length < 10) {
    // Not enough data for outlier detection
    return {
      featureId: spec.id,
      passed: true,
      violations: [],
      checkedAt: new Date().toISOString(),
    };
  }

  // Calculate mean and std
  const values = points.map(p => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  // Check last point for outlier
  const lastPoint = points[points.length - 1];
  const zscore = std === 0 ? 0 : Math.abs((lastPoint.value - mean) / std);

  if (zscore > threshold) {
    violations.push({
      featureId: spec.id,
      rule: 'outlier',
      severity: zscore > 5.0 ? 'critical' : 'warning',
      message: `Outlier detected: value ${lastPoint.value.toFixed(2)}, z-score ${zscore.toFixed(2)}`,
      value: lastPoint.value,
      ts: lastPoint.ts,
    });
  }

  return {
    featureId: spec.id,
    passed: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Run all DQ checks for a feature
 *
 * @param featureId - Feature ID
 * @param spec - Feature specification
 * @param latestPoint - Latest feature point
 * @param recentPoints - Recent points for outlier detection
 * @returns Combined DQ check result
 */
export async function runAllDQChecks(
  featureId: string,
  spec: FeatureSpec,
  latestPoint: FeaturePoint | null,
  recentPoints: FeaturePoint[]
): Promise<DQCheckResult> {
  const allViolations: DQViolation[] = [];

  // Run all checks
  const coverageResult = await checkCoverage(featureId, spec);
  allViolations.push(...coverageResult.violations);

  const freshnessResult = checkFreshness(latestPoint, spec);
  allViolations.push(...freshnessResult.violations);

  if (latestPoint) {
    const rangeResult = checkRange(latestPoint, spec);
    allViolations.push(...rangeResult.violations);
  }

  if (recentPoints.length > 0) {
    const outlierResult = checkOutliers(recentPoints, spec);
    allViolations.push(...outlierResult.violations);
  }

  return {
    featureId,
    passed: allViolations.length === 0,
    violations: allViolations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Get DQ summary statistics
 *
 * @param results - Array of DQ check results
 * @returns Summary statistics
 */
export function getDQSummary(results: DQCheckResult[]): {
  total: number;
  passed: number;
  failed: number;
  by_severity: Record<ViolationSeverity, number>;
  by_rule: Record<string, number>;
} {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    by_severity: { critical: 0, warning: 0, info: 0 } as Record<
      ViolationSeverity,
      number
    >,
    by_rule: {} as Record<string, number>,
  };

  for (const result of results) {
    for (const violation of result.violations) {
      summary.by_severity[violation.severity] += 1;
      summary.by_rule[violation.rule] =
        (summary.by_rule[violation.rule] || 0) + 1;
    }
  }

  return summary;
}
