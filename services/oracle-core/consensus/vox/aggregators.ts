import type { Signal } from '../../registry/schema';

export interface VoxAggregateOptions {
  timeWindowMinutes: number;
}

export function aggregateVoxSignals(signals: Signal[], _options: VoxAggregateOptions): Signal[] {
  // TODO: merge multi-source social sentiment signals to produce unified Vox Populi readings.
  return signals;
}
