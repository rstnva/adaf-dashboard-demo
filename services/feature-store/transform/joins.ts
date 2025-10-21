/**
 * Feature Store - Cross-Feature Joins
 *
 * Joins multiple features for derived features:
 * - Time-aligned joins
 * - Mathematical operations (add, subtract, multiply, divide, ratio)
 * - Statistical operations (correlation, covariance)
 *
 * Fortune 500 Standards:
 * - Deterministic joins (reproducible)
 * - Handle missing data gracefully
 * - Preserve audit trail (evidence from both sources)
 * - Type-safe operations
 *
 * @module services/feature-store/transform/joins
 */

import { FeaturePoint } from '../schema/zod';

/**
 * Join operation types
 */
export type JoinOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'ratio'
  | 'diff';

/**
 * Join result
 */
export interface JoinResult {
  featureId: string; // Derived feature ID
  points: FeaturePoint[];
  leftFeatureId: string;
  rightFeatureId: string;
  operation: JoinOperation;
}

/**
 * Join two feature time-series
 *
 * Performs time-aligned join with specified operation.
 * Only timestamps present in BOTH series are included (inner join).
 *
 * @param leftPoints - Left feature points (sorted by ts)
 * @param rightPoints - Right feature points (sorted by ts)
 * @param operation - Join operation
 * @param derivedFeatureId - ID for derived feature
 * @returns Join result
 */
export function joinFeatures(
  leftPoints: FeaturePoint[],
  rightPoints: FeaturePoint[],
  operation: JoinOperation,
  derivedFeatureId: string
): JoinResult {
  // Build timestamp index for right series
  const rightByTs = new Map<string, FeaturePoint>();
  for (const point of rightPoints) {
    rightByTs.set(point.ts, point);
  }

  const joinedPoints: FeaturePoint[] = [];

  // Iterate left series and join with right
  for (const leftPoint of leftPoints) {
    const rightPoint = rightByTs.get(leftPoint.ts);

    // Inner join: skip if no matching timestamp
    if (!rightPoint) continue;

    // Apply operation
    let value: number;
    let confidence: number;

    try {
      value = applyOperation(leftPoint.value, rightPoint.value, operation);
      confidence = Math.min(leftPoint.confidence, rightPoint.confidence); // Conservative
    } catch (error) {
      console.warn(
        `[FeatureStore:Joins] Operation failed at ${leftPoint.ts}:`,
        error
      );
      continue; // Skip invalid operations
    }

    // Merge evidence
    const evidence = [
      ...(leftPoint.evidence || []),
      ...(rightPoint.evidence || []),
    ];

    joinedPoints.push({
      featureId: derivedFeatureId,
      ts: leftPoint.ts,
      value,
      stale: leftPoint.stale || rightPoint.stale,
      confidence,
      meta: {
        left_value: leftPoint.value,
        right_value: rightPoint.value,
        operation,
      },
      evidence,
    });
  }

  return {
    featureId: derivedFeatureId,
    points: joinedPoints,
    leftFeatureId: leftPoints[0]?.featureId || 'unknown',
    rightFeatureId: rightPoints[0]?.featureId || 'unknown',
    operation,
  };
}

/**
 * Apply mathematical operation
 */
function applyOperation(
  left: number,
  right: number,
  operation: JoinOperation
): number {
  switch (operation) {
    case 'add':
      return left + right;

    case 'subtract':
      return left - right;

    case 'multiply':
      return left * right;

    case 'divide':
      if (right === 0) throw new Error('Division by zero');
      return left / right;

    case 'ratio':
      if (right === 0) throw new Error('Division by zero in ratio');
      return left / right;

    case 'diff':
      return left - right;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Calculate rolling correlation between two features
 *
 * @param leftPoints - Left feature points
 * @param rightPoints - Right feature points
 * @param windowSize - Rolling window size
 * @returns Correlation time series
 */
export function rollingCorrelation(
  leftPoints: FeaturePoint[],
  rightPoints: FeaturePoint[],
  windowSize: number = 20
): FeaturePoint[] {
  // Align timestamps
  const aligned = alignTimestamps(leftPoints, rightPoints);

  const correlations: FeaturePoint[] = [];

  // Calculate rolling correlation
  for (let i = windowSize - 1; i < aligned.length; i++) {
    const window = aligned.slice(i - windowSize + 1, i + 1);

    const leftValues = window.map(p => p.left!);
    const rightValues = window.map(p => p.right!);

    const corr = calculateCorrelation(leftValues, rightValues);

    correlations.push({
      featureId: 'derived/correlation',
      ts: aligned[i].ts,
      value: corr,
      stale: false,
      confidence: 0.9,
    });
  }

  return correlations;
}

/**
 * Align timestamps between two series
 */
function alignTimestamps(
  leftPoints: FeaturePoint[],
  rightPoints: FeaturePoint[]
): Array<{ ts: string; left: number | null; right: number | null }> {
  const rightByTs = new Map(rightPoints.map(p => [p.ts, p.value]));

  return leftPoints
    .map(leftPoint => ({
      ts: leftPoint.ts,
      left: leftPoint.value,
      right: rightByTs.get(leftPoint.ts) ?? null,
    }))
    .filter(p => p.left !== null && p.right !== null);
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const meanX = x.reduce((sum, v) => sum + v, 0) / n;
  const meanY = y.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

/**
 * Calculate z-score normalization
 *
 * Useful for comparing features with different scales.
 *
 * @param points - Feature points
 * @param windowSize - Rolling window for mean/std calculation
 * @returns Z-score normalized points
 */
export function calculateZScore(
  points: FeaturePoint[],
  windowSize: number = 20
): FeaturePoint[] {
  const zscores: FeaturePoint[] = [];

  for (let i = windowSize - 1; i < points.length; i++) {
    const window = points.slice(i - windowSize + 1, i + 1);
    const values = window.map(p => p.value);

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const zscore = std === 0 ? 0 : (points[i].value - mean) / std;

    // Cap z-score at ±3 (remove extreme outliers)
    const cappedZscore = Math.max(-3, Math.min(3, zscore));

    zscores.push({
      ...points[i],
      value: cappedZscore,
      meta: {
        ...points[i].meta,
        original_value: points[i].value,
        zscore_mean: mean,
        zscore_std: std,
      },
    });
  }

  return zscores;
}

/**
 * Calculate exponential moving average (EMA)
 *
 * Smoothing technique for noisy data.
 *
 * @param points - Feature points
 * @param alpha - Smoothing factor (0 < alpha < 1, higher = less smoothing)
 * @returns EMA smoothed points
 */
export function calculateEMA(
  points: FeaturePoint[],
  alpha: number = 0.2
): FeaturePoint[] {
  if (points.length === 0) return [];

  const ema: FeaturePoint[] = [];
  let emaValue = points[0].value; // Initialize with first value

  for (const point of points) {
    emaValue = alpha * point.value + (1 - alpha) * emaValue;

    ema.push({
      ...point,
      value: emaValue,
      meta: {
        ...point.meta,
        original_value: point.value,
        ema_alpha: alpha,
      },
    });
  }

  return ema;
}
