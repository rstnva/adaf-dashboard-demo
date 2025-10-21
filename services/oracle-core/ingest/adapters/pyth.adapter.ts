import { loadAdapterFixture } from './fixtures';
import { fixtureToSample } from './utils';
import type { AdapterHandler } from './types';

export const pythAdapter: AdapterHandler = async request => {
  const fixture = await loadAdapterFixture('pyth', request.sourceId);
  if (!fixture) {
    return null;
  }

  return fixtureToSample('pyth', request, fixture);
};
