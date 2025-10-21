import fs from 'fs';
import path from 'path';

export function getFeedWeights(feedId: string): { live: number; mock: number } {
  const weightsPath = path.resolve(__dirname, '../registry/weights.mixed.json');
  try {
    const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
    return weights[feedId] || { live: 0, mock: 1 };
  } catch {
    return { live: 0, mock: 1 };
  }
}

// Ejemplo de uso en consenso:
// const { live, mock } = getFeedWeights('price/btc_usd');
// const value = live * realValue + mock * mockValue;
