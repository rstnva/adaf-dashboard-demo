import type { PipelineConfig, PipelineNewsItem } from '../types';
import { persistNewsEvents } from '../repository';
import { NewsRSSIngestor } from './rssIngestor';
import { NewsDedupeMachine } from './dedupeMachine';

export interface IngestionResult {
  rawItems: PipelineNewsItem[];
  dedupedItems: PipelineNewsItem[];
  persistedIds: string[];
}

export async function ingestNewsBatch(
  config?: Partial<PipelineConfig>
): Promise<IngestionResult> {
  const ingestor = new NewsRSSIngestor(config);
  const dedupe = new NewsDedupeMachine();

  const rawItems = await ingestor.collect();
  const dedupedItems = await dedupe.filterFresh(rawItems);
  const persisted = await persistNewsEvents(dedupedItems);

  return {
    rawItems,
    dedupedItems,
    persistedIds: persisted.map(item => item.id),
  };
}
