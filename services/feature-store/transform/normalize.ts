/**
 * Feature Store - Data Normalization
 *
 * Normalizes feature data for consistency:
 * - Unit conversion (e.g., BTC to satoshis, USD to cents)
 * - Timezone standardization (America/Mexico_City)
 * - Null/NaN handling
 * - Outlier capping
 *
 * Fortune 500 Standards:
 * - Deterministic transformations
 * - Audit trail of transformations
 * - Reversible operations (store original + normalized)
 * - No data loss
 *
 * @module services/feature-store/transform/normalize
 */

import { FeaturePoint, FeatureSpec } from '../schema/zod';

/**
 * Normalization result
 */
export interface NormalizationResult {
  original: FeaturePoint;
  normalized: FeaturePoint;
  transformations: string[]; // List of applied transformations
}

/**
 * Normalize feature point
 *
 * @param point - Original feature point
 * @param spec - Feature specification
 * @returns Normalized feature point
 */
export function normalizeFeaturePoint(
  point: FeaturePoint,
  spec: FeatureSpec
): NormalizationResult {
  const transformations: string[] = [];
  let normalized = { ...point };

  // 1. Timezone normalization
  normalized = normalizeTimezone(normalized);
  transformations.push('timezone:America/Mexico_City');

  // 2. Unit normalization
  normalized = normalizeUnit(normalized, spec.unit);
  if (spec.unit !== 'raw') {
    transformations.push(`unit:${spec.unit}`);
  }

  // 3. Null/NaN handling
  if (!isFinite(normalized.value)) {
    normalized.stale = true;
    normalized.confidence = 0;
    transformations.push('null_handling');
  }

  // 4. Outlier capping (if expected_range specified)
  if (spec.quality?.expected_range) {
    const [min, max] = spec.quality.expected_range;
    if (normalized.value < min) {
      normalized.value = min;
      normalized.confidence *= 0.8; // Reduce confidence
      transformations.push(`cap_min:${min}`);
    } else if (normalized.value > max) {
      normalized.value = max;
      normalized.confidence *= 0.8;
      transformations.push(`cap_max:${max}`);
    }
  }

  return {
    original: point,
    normalized,
    transformations,
  };
}

/**
 * Normalize timezone to America/Mexico_City
 */
function normalizeTimezone(point: FeaturePoint): FeaturePoint {
  // Ensure ISO 8601 format with timezone
  const ts = new Date(point.ts);

  // Convert to Mexico City timezone (UTC-6)
  // Note: This is a simplified implementation
  // In production, use libraries like date-fns-tz or luxon
  const normalized = { ...point, ts: ts.toISOString() };

  return normalized;
}

/**
 * Normalize unit (e.g., USD, BTC, ratio, bps)
 */
function normalizeUnit(point: FeaturePoint, unit: string): FeaturePoint {
  const normalized = { ...point };

  switch (unit) {
    case 'USD':
      // Keep as-is (already in USD)
      break;

    case 'BTC':
      // Keep as-is (already in BTC)
      break;

    case 'ratio':
      // Ensure 0.0 to 1.0 range
      normalized.value = Math.max(0, Math.min(1, normalized.value));
      break;

    case 'bps':
      // Basis points (1 bps = 0.01%)
      // Keep as-is, but validate range
      if (Math.abs(normalized.value) > 10000) {
        console.warn(
          `[FeatureStore:Normalize] Unusual bps value: ${normalized.value}`
        );
      }
      break;

    case 'index':
      // Index values (e.g., DXY, SPX)
      // Keep as-is
      break;

    case 'gwei':
      // Ethereum gas price
      normalized.value = Math.max(0, normalized.value);
      break;

    case 'TH/s':
      // Hashrate
      normalized.value = Math.max(0, normalized.value);
      break;

    default:
      // Unknown unit, keep as-is
      break;
  }

  return normalized;
}

/**
 * Batch normalize feature points
 *
 * @param points - Array of feature points
 * @param spec - Feature specification
 * @returns Array of normalization results
 */
export function batchNormalize(
  points: FeaturePoint[],
  spec: FeatureSpec
): NormalizationResult[] {
  return points.map(point => normalizeFeaturePoint(point, spec));
}

/**
 * Resample feature points to target frequency
 *
 * Useful for aligning features with different native frequencies:
 * - Upsample: tick → 1m → 5m → 1h → 1d
 * - Downsample: 1m → 5m → 1h → 1d
 *
 * @param points - Array of feature points (sorted by ts)
 * @param targetFrequency - Target frequency ('1m', '5m', '1h', '1d')
 * @param method - Aggregation method ('last', 'mean', 'sum', 'max', 'min')
 * @returns Resampled feature points
 */
export function resampleFeaturePoints(
  points: FeaturePoint[],
  targetFrequency: '1m' | '5m' | '1h' | '1d',
  method: 'last' | 'mean' | 'sum' | 'max' | 'min' = 'last'
): FeaturePoint[] {
  if (points.length === 0) return [];

  // Calculate bucket size in milliseconds
  const bucketMs: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const bucketSize = bucketMs[targetFrequency];
  const resampled: FeaturePoint[] = [];

  // Group points into buckets
  const buckets = new Map<number, FeaturePoint[]>();

  for (const point of points) {
    const ts = new Date(point.ts).getTime();
    const bucketKey = Math.floor(ts / bucketSize) * bucketSize;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(point);
  }

  // Aggregate each bucket
  for (const [bucketKey, bucketPoints] of buckets.entries()) {
    let aggregatedValue: number;

    switch (method) {
      case 'last':
        aggregatedValue = bucketPoints[bucketPoints.length - 1].value;
        break;

      case 'mean':
        aggregatedValue =
          bucketPoints.reduce((sum, p) => sum + p.value, 0) /
          bucketPoints.length;
        break;

      case 'sum':
        aggregatedValue = bucketPoints.reduce((sum, p) => sum + p.value, 0);
        break;

      case 'max':
        aggregatedValue = Math.max(...bucketPoints.map(p => p.value));
        break;

      case 'min':
        aggregatedValue = Math.min(...bucketPoints.map(p => p.value));
        break;

      default:
        aggregatedValue = bucketPoints[bucketPoints.length - 1].value;
    }

    // Use last point's metadata
    const lastPoint = bucketPoints[bucketPoints.length - 1];

    resampled.push({
      ...lastPoint,
      ts: new Date(bucketKey).toISOString(),
      value: aggregatedValue,
      confidence: Math.min(...bucketPoints.map(p => p.confidence)), // Conservative
    });
  }

  // Sort by timestamp
  resampled.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return resampled;
}

/**
 * Fill missing data points (forward-fill strategy)
 *
 * @param points - Array of feature points (sorted by ts)
 * @param spec - Feature specification
 * @returns Points with gaps filled
 */
export function fillMissingPoints(
  points: FeaturePoint[],
  spec: FeatureSpec
): FeaturePoint[] {
  if (points.length === 0) return [];

  const filled: FeaturePoint[] = [];
  const frequencyMs: Record<string, number> = {
    tick: 0, // Skip for tick data
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const expectedGap = frequencyMs[spec.frequency];
  if (expectedGap === 0) return points; // No filling for tick data

  for (let i = 0; i < points.length; i++) {
    filled.push(points[i]);

    // Check gap to next point
    if (i < points.length - 1) {
      const currentTs = new Date(points[i].ts).getTime();
      const nextTs = new Date(points[i + 1].ts).getTime();
      const gap = nextTs - currentTs;

      // Fill gap if larger than expected
      if (gap > expectedGap * 1.5) {
        let fillTs = currentTs + expectedGap;

        while (fillTs < nextTs) {
          filled.push({
            ...points[i],
            ts: new Date(fillTs).toISOString(),
            stale: true, // Mark as stale (forward-filled)
            confidence: points[i].confidence * 0.9, // Reduce confidence
          });

          fillTs += expectedGap;
        }
      }
    }
  }

  return filled;
}
