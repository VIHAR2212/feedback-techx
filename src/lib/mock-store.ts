// Uncharted Expedition — in-memory fallback store.
//
// Used automatically when MongoDB is unreachable (e.g. local dev without a
// mongod instance) so the site keeps working. Data resets on server
// restart. The primary store is mongo-services.ts.

import { FeedbackEntry, ExpeditionUser } from './models';
import { defaultUsers, defaultFeedback } from './seed-data';
import { LABS } from './mock-data';

type GlobalWithStore = typeof globalThis & {
  __unchartedMemoryStore?: {
    feedback: FeedbackEntry[];
    users: Map<string, ExpeditionUser>; // keyed by email
  };
};

const g = globalThis as GlobalWithStore;

if (!g.__unchartedMemoryStore) {
  const usersMap = new Map<string, ExpeditionUser>();
  defaultUsers.forEach((u) => usersMap.set(u.email, u));
  g.__unchartedMemoryStore = {
    feedback: defaultFeedback.slice(),
    users: usersMap,
  };
}

export const memoryStore = g.__unchartedMemoryStore;

// Product catalog is static — expose a lookup so callers can validate
// tableIds without reaching into mock-data directly.
export function getProductLookup(): Map<string, { name: string; labName: string; labId: string }> {
  const map = new Map<string, { name: string; labName: string; labId: string }>();
  for (const lab of LABS) {
    for (const product of lab.products) {
      map.set(product.id, { name: product.name, labName: lab.labName, labId: lab.labId });
    }
  }
  return map;
}
