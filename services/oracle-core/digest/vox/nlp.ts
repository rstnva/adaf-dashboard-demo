import type { Signal } from '../../registry/schema';
import entitiesMap from '../../ingest/vox/taxonomy/entities.map.json';

type EntityMap = Record<string, {
  symbol: string;
  aliases: string[];
  tickers: string[];
  hashtags: string[];
  contracts: string[];
  narratives: string[];
  negative_cases: string[];
}>;

const entities: EntityMap = entitiesMap as EntityMap;

/**
 * Resolve entity (asset symbol) from text using taxonomy map with anti-collision heuristics.
 */
export function resolveEntity(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  
  // Check negative cases first
  for (const [_symbol, data] of Object.entries(entities)) {
    for (const neg of data.negative_cases) {
      if (normalized.includes(neg.toLowerCase())) {
        return null; // Reject negative cases
      }
    }
  }
  
  // Check exact matches (symbol, aliases, tickers, hashtags)
  for (const [symbol, data] of Object.entries(entities)) {
    if (normalized === symbol.toLowerCase()) return symbol;
    if (data.aliases.some(a => normalized === a.toLowerCase())) return symbol;
    if (data.tickers.some(t => normalized === t.toLowerCase())) return symbol;
    if (data.hashtags.some(h => normalized === h.toLowerCase())) return symbol;
  }
  
  // Check partial matches with word boundaries
  for (const [symbol, data] of Object.entries(entities)) {
    const regex = new RegExp(`\\b${symbol.toLowerCase()}\\b`, 'i');
    if (regex.test(normalized)) return symbol;
    for (const alias of data.aliases) {
      const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'i');
      if (aliasRegex.test(normalized)) return symbol;
    }
  }
  
  return null;
}

/**
 * NLP utilities for Vox Populi pipeline: calculate valence using multilingual models.
 */
export function computeValence(_text: string, _lang: string): number {
  // TODO: integrate FinBERT/RoBERTa sentiment estimators with emoji dictionary.
  return 0;
}

export function enrichSignalWithValence(signal: Signal, valence: number): Signal {
  return {
    ...signal,
    confidence: Math.min(1, Math.max(0, valence)),
  };
}
