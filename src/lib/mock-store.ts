// Uncharted Expedition — in-memory mock data store.
// This is the runtime backing for the skeleton. The shape mirrors the
// MongoDB collections from the original project (feedback, users, labs,
// admins) so seniors can replace `mockStore` with a real Mongo/Prisma
// client without touching any page/component/api code.

import { FeedbackEntry, Admin, ExpeditionUser } from './models';
import { LABS, ADMIN_SEED } from './mock-data';

// Module-scoped singleton. Next.js dev server keeps this alive across
// hot reloads via globalThis.
type GlobalWithStore = typeof globalThis & {
  __unchartedStore?: {
    feedback: FeedbackEntry[];
    users: Map<string, ExpeditionUser>; // keyed by email
    admins: Admin[];
    initialized: boolean;
  };
};

const g = globalThis as GlobalWithStore;

if (!g.__unchartedStore) {
  g.__unchartedStore = {
    feedback: [],
    users: new Map(),
    admins: [
      {
        ...ADMIN_SEED,
        createdAt: new Date(),
      },
    ],
    initialized: true,
  };
}

export const mockStore = g.__unchartedStore!;

// Re-seed admins if somehow empty on a hot reload
if (mockStore.admins.length === 0) {
  mockStore.admins.push({ ...ADMIN_SEED, createdAt: new Date() });
}

// Labs are read straight from static mock-data (no need for a "labs"
// collection in the store, but we expose a getter so services can mimic
// the original getLabs() signature).
export function getMockLabs() {
  return LABS.map((l) => ({ ...l }));
}
