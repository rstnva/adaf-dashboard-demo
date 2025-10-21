import type { Signal } from '../../registry/schema';

/**
 * Vox Populi adapter for Discord servers (opt-in only).
 */
export async function fetchDiscordSignals(): Promise<Signal[]> {
  // TODO: hook into Discord bots, aggregate sentiment and volume metrics.
  return [];
}
