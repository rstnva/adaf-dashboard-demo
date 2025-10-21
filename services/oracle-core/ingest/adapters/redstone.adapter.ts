import { loadAdapterFixture } from './fixtures';
import { fixtureToSample } from './utils';
import type { AdapterHandler } from './types';

export const redstoneAdapter: AdapterHandler = async request => {
  const fixture = await loadAdapterFixture('redstone', request.sourceId);
  if (!fixture) {
    return null;
  }

  return fixtureToSample('redstone', request, fixture);
};
