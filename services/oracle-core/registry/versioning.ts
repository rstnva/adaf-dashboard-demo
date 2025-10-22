const registryVersions: Record<string, number> = {};

export function setRegistryVersion(namespace: string, version: number) {
  registryVersions[namespace] = version;
}

export function getRegistryVersion(namespace: string): number | undefined {
  return registryVersions[namespace];
}

export function listRegistryVersions(): Record<string, number> {
  return { ...registryVersions };
}
