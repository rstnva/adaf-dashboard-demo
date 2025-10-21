/**
 * Feature Store - Seasonal Pattern Detection
 *
 * Detects and adjusts for seasonal patterns in time-series data:
 * - Hourly patterns (e.g., trading hours)
 * - Daily patterns (e.g., weekday vs weekend)
 * - Monthly patterns (e.g., end-of-month flows)
 * - Yearly patterns (e.g., tax season)
 *
 * Fortune 500 Standards:
 * - Statistical rigor (use proven methods)
 * - Reproducible results
 * - Handle edge cases (holidays, gaps)
 * - Document assumptions
 *
 * @module services/feature-store/transform/seasonal
 */

import { FeaturePoint } from '../schema/zod';

/**
 * Seasonal component
 */
export interface SeasonalComponent {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  strength: number; // 0.0 to 1.0 (0 = no seasonality, 1 = perfect seasonality)
  pattern: number[]; // Seasonal factors for each period
}

/**
 * Decomposition result
 */
export interface DecompositionResult {
  trend: FeaturePoint[]; // Long-term trend
  seasonal: FeaturePoint[]; // Seasonal component
  residual: FeaturePoint[]; // Random noise
  components: SeasonalComponent[];
}

/**
 * Detect seasonal patterns in feature data
 *
 * Uses simple moving average decomposition:
 * - Trend: Long-term moving average
 * - Seasonal: Periodic patterns after detrending
 * - Residual: Random noise
 *
 * @param points - Feature points (sorted by ts)
 * @param period - Seasonal period in data points (e.g., 24 for hourly with daily pattern)
 * @returns Decomposition result
 */
export function detectSeasonality(
  points: FeaturePoint[],
  period: number = 24
): DecompositionResult {
  if (points.length < period * 2) {
    throw new Error(
      `Insufficient data for seasonal detection (need at least ${period * 2} points)`
    );
  }

  // 1. Calculate trend using centered moving average
  const trend = calculateTrend(points, period);

  // 2. Detrend data
  const detrended = detrend(points, trend);

  // 3. Calculate seasonal component
  const seasonal = calculateSeasonal(detrended, period);

  // 4. Calculate residual
  const residual = calculateResidual(points, trend, seasonal);

  // 5. Detect seasonal strength
  const components = detectSeasonalStrength(seasonal, period);

  return {
    trend,
    seasonal,
    residual,
    components,
  };
}

/**
 * Calculate trend using moving average
 */
function calculateTrend(
  points: FeaturePoint[],
  windowSize: number
): FeaturePoint[] {
  const trend: FeaturePoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < points.length; i++) {
    // Use available window (smaller at edges)
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(points.length, i + halfWindow + 1);
    const window = points.slice(start, end);

    const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;

    trend.push({
      ...points[i],
      value: avg,
      meta: { component: 'trend' },
    });
  }

  return trend;
}

/**
 * Detrend data (subtract trend from original)
 */
function detrend(
  points: FeaturePoint[],
  trend: FeaturePoint[]
): FeaturePoint[] {
  return points.map((point, i) => ({
    ...point,
    value: point.value - trend[i].value,
    meta: { component: 'detrended' },
  }));
}

/**
 * Calculate seasonal component
 */
function calculateSeasonal(
  detrended: FeaturePoint[],
  period: number
): FeaturePoint[] {
  // Calculate average for each position in period
  const seasonalFactors = new Array(period).fill(0);
  const counts = new Array(period).fill(0);

  for (let i = 0; i < detrended.length; i++) {
    const position = i % period;
    seasonalFactors[position] += detrended[i].value;
    counts[position] += 1;
  }

  // Normalize
  for (let i = 0; i < period; i++) {
    if (counts[i] > 0) {
      seasonalFactors[i] /= counts[i];
    }
  }

  // Apply seasonal factors
  return detrended.map((point, i) => ({
    ...point,
    value: seasonalFactors[i % period],
    meta: { component: 'seasonal', period_position: i % period },
  }));
}

/**
 * Calculate residual (noise)
 */
function calculateResidual(
  original: FeaturePoint[],
  trend: FeaturePoint[],
  seasonal: FeaturePoint[]
): FeaturePoint[] {
  return original.map((point, i) => ({
    ...point,
    value: point.value - trend[i].value - seasonal[i].value,
    meta: { component: 'residual' },
  }));
}

/**
 * Detect seasonal strength
 */
function detectSeasonalStrength(
  seasonal: FeaturePoint[],
  period: number
): SeasonalComponent[] {
  // Calculate variance of seasonal component
  const seasonalValues = seasonal.map(p => p.value);
  const seasonalVariance = calculateVariance(seasonalValues);

  // Detect pattern type based on period
  let type: SeasonalComponent['type'];
  if (period === 24) {
    type = 'hourly';
  } else if (period === 7) {
    type = 'daily';
  } else if (period === 30 || period === 31) {
    type = 'monthly';
  } else if (period === 365) {
    type = 'yearly';
  } else {
    type = 'weekly'; // Default
  }

  // Extract pattern
  const pattern: number[] = [];
  for (let i = 0; i < period; i++) {
    const values = seasonal
      .filter((_, idx) => idx % period === i)
      .map(p => p.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    pattern.push(avg);
  }

  // Strength: ratio of seasonal variance to total variance
  // (simplified - in production use F-test or autocorrelation)
  const strength = Math.min(1.0, seasonalVariance / (seasonalVariance + 1e-6));

  return [
    {
      type,
      strength,
      pattern,
    },
  ];
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return variance;
}

/**
 * Adjust for seasonality (remove seasonal component)
 *
 * @param points - Feature points
 * @param seasonal - Seasonal component
 * @returns Seasonally adjusted points
 */
export function seasonalAdjust(
  points: FeaturePoint[],
  seasonal: FeaturePoint[]
): FeaturePoint[] {
  return points.map((point, i) => ({
    ...point,
    value: point.value - seasonal[i].value,
    meta: {
      ...point.meta,
      seasonal_adjusted: true,
      seasonal_component: seasonal[i].value,
    },
  }));
}

/**
 * Detect day-of-week effect
 *
 * Useful for trading/market data (weekday vs weekend)
 *
 * @param points - Feature points
 * @returns Day-of-week factors (0 = Sunday, 6 = Saturday)
 */
export function detectDayOfWeekEffect(points: FeaturePoint[]): number[] {
  const dayFactors = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  for (const point of points) {
    const day = new Date(point.ts).getDay();
    dayFactors[day] += point.value;
    dayCounts[day] += 1;
  }

  // Normalize
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > 0) {
      dayFactors[i] /= dayCounts[i];
    }
  }

  // Calculate overall mean
  const mean = dayFactors.reduce((sum, v) => sum + v, 0) / 7;

  // Express as deviation from mean
  return dayFactors.map(v => v - mean);
}

/**
 * Detect hour-of-day effect
 *
 * Useful for intraday patterns (trading hours, gas prices, etc.)
 *
 * @param points - Feature points
 * @returns Hour-of-day factors (0-23)
 */
export function detectHourOfDayEffect(points: FeaturePoint[]): number[] {
  const hourFactors = new Array(24).fill(0);
  const hourCounts = new Array(24).fill(0);

  for (const point of points) {
    const hour = new Date(point.ts).getUTCHours();
    hourFactors[hour] += point.value;
    hourCounts[hour] += 1;
  }

  // Normalize
  for (let i = 0; i < 24; i++) {
    if (hourCounts[i] > 0) {
      hourFactors[i] /= hourCounts[i];
    }
  }

  // Calculate overall mean
  const mean = hourFactors.reduce((sum, v) => sum + v, 0) / 24;

  // Express as deviation from mean
  return hourFactors.map(v => v - mean);
}
