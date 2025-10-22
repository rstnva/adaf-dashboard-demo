import { loadAdapterFixture } from './fixtures';
import { fixtureToSample } from './utils';
import type { AdapterHandler } from './types';

export const chainlinkAdapter: AdapterHandler = async request => {
  const fixture = await loadAdapterFixture('chainlink', request.sourceId);
  if (!fixture) {
    return null;
  }

  return fixtureToSample('chainlink', request, fixture);
};
