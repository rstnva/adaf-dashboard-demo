import type { Feed } from '../../registry/schema';
import type { RawSample } from '../../pipeline';
import { bandTellorAdapter } from './band-tellor.adapter';
import { chainlinkAdapter } from './chainlink.adapter';
import { chronicleUmaAdapter } from './chronicle-uma.adapter';
import { pythAdapter } from './pyth.adapter';
import { redstoneAdapter } from './redstone.adapter';
import type { AdapterHandler, AdapterOptions } from './types';

const registry: Array<{ matcher: (_sourceId: string) => boolean; handler: AdapterHandler }> = [
  { matcher: sourceId => sourceId.startsWith('chainlink-'), handler: chainlinkAdapter },
  { matcher: sourceId => sourceId.startsWith('pyth-'), handler: pythAdapter },
  { matcher: sourceId => sourceId.startsWith('redstone-'), handler: redstoneAdapter },
  {
    matcher: sourceId => sourceId.startsWith('band-') || sourceId.startsWith('tellor-'),
    handler: bandTellorAdapter,
  },
  {
    matcher: sourceId => sourceId.startsWith('chronicle-') || sourceId.startsWith('uma-'),
    handler: chronicleUmaAdapter,
  },
];

function resolveAdapter(sourceId: string): AdapterHandler | null {
  const entry = registry.find(candidate => candidate.matcher(sourceId));
  return entry ? entry.handler : null;
}

export async function collectAdapterSamples(
  feed: Feed,
  options: AdapterOptions = {}
): Promise<RawSample[]> {
  const now = options.now ?? new Date();
  const samples: RawSample[] = [];

  for (const source of feed.sources ?? []) {
    const handler = resolveAdapter(source.id);
    if (!handler) {
      continue;
    }

    const result = await handler({
      feed,
      sourceId: source.id,
      weight: source.weight,
      now,
    });

    if (result) {
      samples.push(result);
    }
  }

  return samples;
}
