import type { Signal } from '../../registry/schema';

/**
 * Vox Populi adapter for crypto news feeds (GDELT or providers).
 */
export async function fetchNewsSignals(): Promise<Signal[]> {
  // TODO: fetch sentiment, velocity and narrative tagging from news sources.
  return [];
}
