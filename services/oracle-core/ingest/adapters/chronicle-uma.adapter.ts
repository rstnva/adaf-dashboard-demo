import { loadAdapterFixture } from './fixtures';
import { fixtureToSample } from './utils';
import type { AdapterHandler } from './types';

export const chronicleUmaAdapter: AdapterHandler = async request => {
  const fixture = await loadAdapterFixture('chronicle-uma', request.sourceId);
  if (!fixture) {
    return null;
  }

  return fixtureToSample('chronicle-uma', request, fixture);
};
