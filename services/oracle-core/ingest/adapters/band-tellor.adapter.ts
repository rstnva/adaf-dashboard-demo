import { loadAdapterFixture } from './fixtures';
import { fixtureToSample } from './utils';
import type { AdapterHandler } from './types';

export const bandTellorAdapter: AdapterHandler = async request => {
  const fixture = await loadAdapterFixture('band-tellor', request.sourceId);
  if (!fixture) {
    return null;
  }

  return fixtureToSample('band-tellor', request, fixture);
};
