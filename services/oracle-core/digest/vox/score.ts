import type { Signal } from '../../registry/schema';

export interface VoxScores {
  valence: number;
  volume: number;
  velocity: number;
  credibility: number;
  vpi: number;
}

export function computeVoxScores(params: {
  valence: number;
  volume: number;
  velocity: number;
  credibility: number;
  weights?: [number, number, number, number];
}): VoxScores {
  const { valence, volume, velocity, credibility, weights = [0.35, 0.25, 0.25, 0.15] } = params;
  const [wV, wVol, wVel, wCred] = weights;
  const safeVolume = Math.max(1, volume);
  const vpiRaw = wV * valence + wVol * Math.log(safeVolume) + wVel * velocity + wCred * credibility;
  return {
    valence,
    volume,
    velocity,
    credibility,
    vpi: Math.max(0, Math.min(100, Number(vpiRaw.toFixed(2)))),
  };
}

export function attachVoxScores(signal: Signal, scores: VoxScores): Signal {
  return {
    ...signal,
    confidence: Math.min(1, Math.max(0, scores.credibility)),
    tags: Array.from(new Set([...signal.tags, 'vox'])),
  };
}

// Sentiment shock (z-score en ventana)
export function computeShock(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / values.length);
  const last = values[values.length - 1];
  return std ? (last - mean) / std : 0;
}

// Divergence HP: |∆VPI − ∆precio| normalizado (HP o EMA)
export function computeDivergenceHP(vpi: number[], price: number[]): number {
  if (vpi.length < 2 || price.length < 2) return 0;
  const deltaVpi = vpi[vpi.length - 1] - vpi[vpi.length - 2];
  const deltaPrice = price[price.length - 1] - price[price.length - 2];
  const norm = Math.max(Math.abs(deltaVpi), Math.abs(deltaPrice), 1e-6);
  return Math.abs(deltaVpi - deltaPrice) / norm;
}

// Lead-lag: desfase (minutos) del máximo cross-corr VPI↔retornos
export function computeLeadLag(vpi: number[], returns: number[], maxLag: number = 60): number {
  let bestLag = 0, bestCorr = -Infinity;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let x = [], y = [];
    for (let i = 0; i < vpi.length; i++) {
      const j = i + lag;
      if (j >= 0 && j < returns.length) {
        x.push(vpi[i]);
        y.push(returns[j]);
      }
    }
    if (x.length > 2) {
      const mx = x.reduce((a, b) => a + b, 0) / x.length;
      const my = y.reduce((a, b) => a + b, 0) / y.length;
      const cov = x.map((xi, k) => (xi - mx) * (y[k] - my)).reduce((a, b) => a + b, 0) / x.length;
      const sx = Math.sqrt(x.map(xi => (xi - mx) ** 2).reduce((a, b) => a + b, 0) / x.length);
      const sy = Math.sqrt(y.map(yi => (yi - my) ** 2).reduce((a, b) => a + b, 0) / y.length);
      const corr = sx && sy ? cov / (sx * sy) : 0;
      if (Math.abs(corr) > Math.abs(bestCorr)) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
  }
  return bestLag;
}

// Brigading score: sincronía multi-fuente + baja credibilidad
export function computeBrigadingScore(overlapIndex: number, avgCred: number): number {
  // 0..100, penaliza credibilidad baja y overlap alto
  return Math.round(100 * overlapIndex * (1 - avgCred));
}

// Emergence: novedad + aceleración del tópico
export function computeEmergence(topicCounts: number[]): number {
  if (topicCounts.length < 3) return 0;
  const acc = topicCounts[topicCounts.length - 1] - topicCounts[topicCounts.length - 2];
  const prevAcc = topicCounts[topicCounts.length - 2] - topicCounts[topicCounts.length - 3];
  return Math.max(0, acc - prevAcc);
}

// Influencer cred score: reputación normalizada
export function computeCredScore(followers: number, accountAgeDays: number, engagement: number): number {
  // 0..1, pondera seguidores, antigüedad y engagement
  const f = Math.log10(followers + 1) / 6;
  const a = Math.min(accountAgeDays / 365, 1);
  const e = Math.min(engagement, 1);
  return Math.max(0, Math.min(1, 0.5 * f + 0.3 * a + 0.2 * e));
}
