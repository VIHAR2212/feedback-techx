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

const defaultUsers: ExpeditionUser[] = [
  {
    email: 'drake@uncharted.com',
    name: 'Nathan Drake',
    department: 'AI-DS',
    completedProducts: ['a-p1', 'a-p2', 'b-p1', 'b-p2', 'c-p1'],
    unlockedLabs: ['a', 'b', 'c'],
    completedLabs: ['a', 'b', 'c'],
    shards: ['a', 'b', 'c'],
    discoveredClues: ['clue-a-1', 'clue-b-1'],
    discoveredTreasures: ['tr-coin'],
    isCompleted: true,
    completionDate: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    email: 'elena@press.org',
    name: 'Elena Fisher',
    department: 'COMPS',
    completedProducts: ['a-p1', 'b-p1', 'c-p1'],
    unlockedLabs: ['a', 'b', 'c'],
    completedLabs: ['a', 'b', 'c'],
    shards: ['a', 'b', 'c'],
    discoveredClues: ['clue-a-2'],
    discoveredTreasures: ['tr-relic'],
    isCompleted: true,
    completionDate: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    email: 'sully@treasure.net',
    name: 'Victor Sullivan',
    department: 'EXTC',
    completedProducts: ['a-p1', 'a-p2', 'b-p1'],
    unlockedLabs: ['a', 'b'],
    completedLabs: ['a', 'b'],
    shards: ['a', 'b'],
    discoveredClues: ['clue-b-2'],
    discoveredTreasures: ['tr-map'],
    isCompleted: false,
  },
  {
    email: 'chloe@expedition.io',
    name: 'Chloe Frazer',
    department: 'IT',
    completedProducts: ['a-p1', 'a-p2'],
    unlockedLabs: ['a', 'b'],
    completedLabs: ['a'],
    shards: ['a'],
    discoveredClues: ['clue-a-1'],
    discoveredTreasures: ['tr-coin'],
    isCompleted: false,
  },
  {
    email: 'nadine@shoreline.sec',
    name: 'Nadine Ross',
    department: 'MECH',
    completedProducts: ['a-p1', 'b-p1'],
    unlockedLabs: ['a', 'b'],
    completedLabs: ['a'],
    shards: ['a'],
    discoveredClues: ['clue-a-2'],
    discoveredTreasures: [],
    isCompleted: false,
  },
  {
    email: 'sam@libertalia.org',
    name: 'Samuel Drake',
    department: 'AI-DS',
    completedProducts: ['a-p1'],
    unlockedLabs: ['a'],
    completedLabs: [],
    shards: ['a'],
    discoveredClues: [],
    discoveredTreasures: [],
    isCompleted: false,
  },
  {
    email: 'rafe@adlercorp.com',
    name: 'Rafe Adler',
    department: 'CIVIL',
    completedProducts: ['a-p1'],
    unlockedLabs: ['a'],
    completedLabs: [],
    shards: [],
    discoveredClues: [],
    discoveredTreasures: [],
    isCompleted: false,
  },
  {
    email: 'cutter@history.org',
    name: 'Charlie Cutter',
    department: 'VLSI',
    completedProducts: ['a-p1'],
    unlockedLabs: ['a'],
    completedLabs: [],
    shards: [],
    discoveredClues: [],
    discoveredTreasures: [],
    isCompleted: false,
  },
];

const initialUsersMap = new Map<string, ExpeditionUser>();
defaultUsers.forEach((u) => initialUsersMap.set(u.email, u));

const defaultFeedback: FeedbackEntry[] = [
  {
    _id: 'fb-1',
    studentName: 'Nathan Drake',
    studentEmail: 'drake@uncharted.com',
    studentDepartment: 'AI-DS',
    labId: 'a',
    tableId: 'a-p1',
    rating: 5,
    comment: 'Spectacular mountain discovery.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    _id: 'fb-2',
    studentName: 'Nathan Drake',
    studentEmail: 'drake@uncharted.com',
    studentDepartment: 'AI-DS',
    labId: 'b',
    tableId: 'b-p1',
    rating: 5,
    comment: 'Found the ancient vault.',
    timestamp: new Date(Date.now() - 2600000).toISOString(),
    createdAt: new Date(Date.now() - 2600000),
  },
  {
    _id: 'fb-3',
    studentName: 'Elena Fisher',
    studentEmail: 'elena@press.org',
    studentDepartment: 'COMPS',
    labId: 'a',
    tableId: 'a-p1',
    rating: 5,
    comment: 'Rich history documented.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    _id: 'fb-4',
    studentName: 'Victor Sullivan',
    studentEmail: 'sully@treasure.net',
    studentDepartment: 'EXTC',
    labId: 'a',
    tableId: 'a-p2',
    rating: 4,
    comment: 'Good haul of relics.',
    timestamp: new Date(Date.now() - 1400000).toISOString(),
    createdAt: new Date(Date.now() - 1400000),
  },
];

if (!g.__unchartedStore) {
  g.__unchartedStore = {
    feedback: defaultFeedback,
    users: initialUsersMap,
    admins: [
      {
        ...ADMIN_SEED,
        createdAt: new Date(),
      },
    ],
    initialized: true,
  };
} else {
  // Ensure default users exist if empty
  if (g.__unchartedStore.users.size === 0) {
    defaultUsers.forEach((u) => g.__unchartedStore!.users.set(u.email, u));
  }
  if (g.__unchartedStore.feedback.length === 0) {
    g.__unchartedStore.feedback = defaultFeedback;
  }
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
