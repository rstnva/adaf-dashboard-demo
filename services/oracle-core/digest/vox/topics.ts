import type { Signal } from '../../registry/schema';

interface Narrative {
  id: string;
  keywords: string[];
}

export function detectNarratives(_text: string, narratives: Narrative[]): string[] {
  // TODO: implement BERTopic or keyword matching for narrative detection.
  return narratives.slice(0, 1).map(n => n.id);
}

export function tagSignalWithNarratives(signal: Signal, narrativeIds: string[]): Signal {
  return {
    ...signal,
    tags: Array.from(new Set([...signal.tags, ...narrativeIds.map(id => `narrative:${id}`)])),
  };
}
