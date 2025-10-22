import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const REGISTRY_SEGMENTS = ['services', 'oracle-core', 'registry'];

async function tryRead(filePath: string) {
  try {
    await access(filePath);
    const raw = await readFile(filePath, 'utf-8');
    return raw;
  } catch {
    return null;
  }
}

export async function readRegistryJson(fileName: string): Promise<unknown> {
  const candidates = [
    path.resolve(process.cwd(), '../../../', ...REGISTRY_SEGMENTS, fileName),
    path.resolve(process.cwd(), ...REGISTRY_SEGMENTS, fileName),
  ];
  for (const c of candidates) {
    const raw = await tryRead(c);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  }
  throw new Error(`Registry file not found: ${fileName}`);
}
