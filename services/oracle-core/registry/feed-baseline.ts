import type { Feed } from './schema';

interface BaselineConfig {
  base: number;
  amplitude: number;
}

const CATEGORY_BASE: Record<string, BaselineConfig> = {
  wsp: { base: 50, amplitude: 15 },
  news: { base: 0.5, amplitude: 0.3 },
  blackbox: { base: 100_000_000, amplitude: 25_000_000 },
  alpha: { base: 0.6, amplitude: 0.2 },
  vol: { base: 40, amplitude: 10 },
  equities: { base: 0.7, amplitude: 0.2 },
  capacity: { base: 0.5, amplitude: 0.25 },
  tca: { base: 35, amplitude: 12 },
  blockspace: { base: 0.5, amplitude: 0.3 },
  gov: { base: 5, amplitude: 3 },
  oracles: { base: 0.2, amplitude: 0.1 },
  stables: { base: 5, amplitude: 2 },
  consumers: { base: 120, amplitude: 40 },
};

function adjustByUnit(base: BaselineConfig, feed: Feed): BaselineConfig {
  if (feed.unit === 'usd') {
    return { base: base.base * 1_000_000, amplitude: base.amplitude * 250_000 };
  }
  if (feed.unit === 'bps') {
    return { base: 120, amplitude: 40 };
  }
  if (feed.unit === 'ms') {
    return { base: 80, amplitude: 20 };
  }
  if (feed.unit === 'gwei') {
    return { base: 45, amplitude: 15 };
  }
  if (feed.unit === 'lamports') {
    return { base: 0.0001, amplitude: 0.00005 };
  }
  if (feed.unit === 'ratio') {
    return { base: 0.6, amplitude: 0.3 };
  }
  return base;
}

export function getFeedBaseline(feed: Feed): BaselineConfig {
  const entry = CATEGORY_BASE[feed.category] ?? { base: 1, amplitude: 0.2 };
  return adjustByUnit(entry, feed);
}

export function estimateBaselineValue(feed: Feed): number {
  const { base } = getFeedBaseline(feed);
  return base;
}
