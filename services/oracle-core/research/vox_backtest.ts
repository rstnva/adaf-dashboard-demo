// Vox Populi Research Backtest Harness
import fs from 'fs';

export interface BacktestFeatures {
  vpi: number;
  deltaVpi: number;
  velocityZ: number;
  shock: number;
  brigading: number;
  topicDominance: number;
}

export interface BacktestTarget {
  signRet1h: number; // -1, 0, 1
  ret24h: number; // actual return
}

export interface BacktestResult {
  asset: string;
  ic: number; // Information Coefficient
  auc: number; // AUC for sign prediction
  precisionAtK: number;
  leadLagMatrix: Record<string, number>; // lag -> corr
}

/**
 * Compute Information Coefficient (IC) between features and returns.
 */
export function computeIC(features: number[], targets: number[]): number {
  if (features.length !== targets.length || features.length < 2) return 0;
  
  const n = features.length;
  const meanF = features.reduce((a, b) => a + b, 0) / n;
  const meanT = targets.reduce((a, b) => a + b, 0) / n;
  
  const cov = features.map((f, i) => (f - meanF) * (targets[i] - meanT)).reduce((a, b) => a + b, 0) / n;
  const stdF = Math.sqrt(features.map(f => (f - meanF) ** 2).reduce((a, b) => a + b, 0) / n);
  const stdT = Math.sqrt(targets.map(t => (t - meanT) ** 2).reduce((a, b) => a + b, 0) / n);
  
  return stdF && stdT ? cov / (stdF * stdT) : 0;
}

/**
 * Compute AUC for binary classification (sign prediction).
 */
export function computeAUC(predictions: number[], actuals: number[]): number {
  if (predictions.length !== actuals.length || predictions.length < 2) return 0.5;
  
  // Simple AUC approximation: rank correlation
  const pairs = predictions.map((p, i) => ({ pred: p, actual: actuals[i] }))
    .sort((a, b) => b.pred - a.pred);
  
  let concordant = 0, total = 0;
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (pairs[i].actual > pairs[j].actual) concordant++;
      total++;
    }
  }
  
  return total ? concordant / total : 0.5;
}

/**
 * Compute precision@k (top k predictions correct).
 */
export function computePrecisionAtK(predictions: number[], actuals: number[], k: number): number {
  if (predictions.length < k) return 0;
  
  const pairs = predictions.map((p, i) => ({ pred: p, actual: actuals[i] }))
    .sort((a, b) => b.pred - a.pred)
    .slice(0, k);
  
  const correct = pairs.filter(p => p.actual > 0).length;
  return correct / k;
}

/**
 * Run backtest on synthetic/historical data.
 */
export async function runVoxBacktest(asset: string, windowSize: number = 100): Promise<BacktestResult> {
  // TODO: Load real historical data
  // For now, generate synthetic data
  const features: BacktestFeatures[] = [];
  const targets: BacktestTarget[] = [];
  
  for (let i = 0; i < windowSize; i++) {
    features.push({
      vpi: Math.random() * 100,
      deltaVpi: Math.random() * 10 - 5,
      velocityZ: Math.random() * 4 - 2,
      shock: Math.random() * 3 - 1.5,
      brigading: Math.random() * 100,
      topicDominance: Math.random(),
    });
    
    targets.push({
      signRet1h: Math.random() > 0.5 ? 1 : -1,
      ret24h: Math.random() * 0.1 - 0.05,
    });
  }
  
  // Compute metrics
  const ic = computeIC(
    features.map(f => f.vpi),
    targets.map(t => t.ret24h)
  );
  
  const auc = computeAUC(
    features.map(f => f.vpi),
    targets.map(t => t.signRet1h)
  );
  
  const precisionAtK = computePrecisionAtK(
    features.map(f => f.vpi),
    targets.map(t => t.signRet1h),
    10
  );
  
  // Lead-lag matrix (simplified)
  const leadLagMatrix: Record<string, number> = {};
  for (let lag = -12; lag <= 12; lag++) {
    leadLagMatrix[`${lag}h`] = Math.random() * 0.5 - 0.25;
  }
  
  return {
    asset,
    ic,
    auc,
    precisionAtK,
    leadLagMatrix,
  };
}

/**
 * Export backtest results to JSON.
 */
export async function exportBacktestResults(results: BacktestResult[], outputPath: string = '/tmp/vox_backtest.json') {
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Backtest results exported to ${outputPath}`);
}

// CLI runner
if (require.main === module) {
  (async () => {
    const assets = ['BTC', 'ETH', 'SOL'];
    const results: BacktestResult[] = [];
    
    for (const asset of assets) {
      console.log(`Running backtest for ${asset}...`);
      const result = await runVoxBacktest(asset, 100);
      results.push(result);
    }
    
    await exportBacktestResults(results);
    console.log('Backtest complete.');
  })();
}
