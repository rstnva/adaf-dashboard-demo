import { describe, it, expect } from 'vitest';
import { readRegistryJson } from '../registry/registry.util';

describe('readRegistryJson', () => {
  it('resolves feeds.mock.json', async () => {
    const result = await readRegistryJson('feeds.mock.json');
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBeGreaterThan(0);
  });

  it('throws for missing file', async () => {
    await expect(readRegistryJson('missing.json')).rejects.toThrow('Registry file not found');
  });
});
