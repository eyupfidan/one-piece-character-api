import fs from 'node:fs/promises';
import path from 'node:path';
import type { CachePayload } from '../types/domain';

export const cachePath = path.join(__dirname, '../../data/source-cache.json');

export async function readCache(): Promise<CachePayload | null> {
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache(payload: CachePayload): Promise<void> {
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2));
  } catch {
    // best effort
  }
}
