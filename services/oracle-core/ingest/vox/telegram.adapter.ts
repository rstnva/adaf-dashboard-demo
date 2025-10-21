import type { Signal } from '../../registry/schema';

/**
 * Vox Populi adapter for Telegram public channels.
 */
export async function fetchTelegramSignals(): Promise<Signal[]> {
  // TODO: integrate via Telethon or provider to capture volume and sentiment.
  return [];
}
