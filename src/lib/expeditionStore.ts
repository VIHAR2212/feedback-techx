// Client-side labs cache (module singleton).
//
// The static `expeditionLabs` proxy in expeditionData.ts resolves through
// this cache first, so admin edits fetched from /api/admin/labs show up in
// every journal page without changing how components read data.
// Falls back to the static seed when the cache is empty.
// LabsContext listens for the `labsUpdated` window event to re-render.

import type { ExpeditionLab } from './expeditionData';

export type LabsCache = Record<string, ExpeditionLab>; // keyed '1' | '2' | '3'

let cache: LabsCache = {};

export function setLabsCache(labs: LabsCache): void {
  cache = { ...labs };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('labsUpdated', { detail: labs }));
  }
}

export function getCachedLab(key: string): ExpeditionLab | undefined {
  return cache[key];
}
