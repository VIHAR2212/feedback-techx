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
  {
    email: 'flynn@mercenary.org',
    name: 'Harry Flynn',
    department: 'EXTC',
    completedProducts: ['a-p1'],
    unlockedLabs: ['a'],
    completedLabs: [],
    shards: [],
    discoveredClues: [],
    discoveredTreasures: [],
    isCompleted: false,
  },
  {
    email: 'tenzin@himalayas.net',
    name: 'Tenzin Sherpa',
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
    email: 'marlowe@hermetic.co.uk',
    name: 'Katherine Marlowe',
    department: 'COMPS',
    completedProducts: ['a-p1'],
    unlockedLabs: ['a'],
    completedLabs: [],
    shards: [],
    discoveredClues: [],
    discoveredTreasures: [],
    isCompleted: false,
  },
  {
    email: 'talbot@hermetic.co.uk',
    name: 'Talbot Hermetic',
    department: 'MECH',
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
  {
    _id: 'fb-5',
    studentName: 'Chloe Frazer',
    studentEmail: 'chloe@expedition.io',
    studentDepartment: 'IT',
    labId: 'a',
    tableId: 'a-p1',
    rating: 4,
    comment: 'Interesting tech relics.',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    createdAt: new Date(Date.now() - 1200000),
  },
  {
    _id: 'fb-6',
    studentName: 'Nadine Ross',
    studentEmail: 'nadine@shoreline.sec',
    studentDepartment: 'MECH',
    labId: 'a',
    tableId: 'a-p2',
    rating: 4,
    comment: 'Rigorous expedition challenge.',
    timestamp: new Date(Date.now() - 1100000).toISOString(),
    createdAt: new Date(Date.now() - 1100000),
  },
  {
    _id: 'fb-7',
    studentName: 'Samuel Drake',
    studentEmail: 'sam@libertalia.org',
    studentDepartment: 'AI-DS',
    labId: 'a',
    tableId: 'a-p1',
    rating: 4,
    comment: 'Great clues everywhere.',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    createdAt: new Date(Date.now() - 900000),
  },
  {
    _id: 'fb-8',
    studentName: 'Rafe Adler',
    studentEmail: 'rafe@adlercorp.com',
    studentDepartment: 'CIVIL',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'High ambition expedition.',
    timestamp: new Date(Date.now() - 800000).toISOString(),
    createdAt: new Date(Date.now() - 800000),
  },
  {
    _id: 'fb-9',
    studentName: 'Charlie Cutter',
    studentEmail: 'cutter@history.org',
    studentDepartment: 'VLSI',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'Solid historical reference.',
    timestamp: new Date(Date.now() - 700000).toISOString(),
    createdAt: new Date(Date.now() - 700000),
  },
  {
    _id: 'fb-10',
    studentName: 'Harry Flynn',
    studentEmail: 'flynn@mercenary.org',
    studentDepartment: 'EXTC',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'Found the entrance waypoint.',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    createdAt: new Date(Date.now() - 600000),
  },
  {
    _id: 'fb-11',
    studentName: 'Tenzin Sherpa',
    studentEmail: 'tenzin@himalayas.net',
    studentDepartment: 'CIVIL',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'Guided path scouted.',
    timestamp: new Date(Date.now() - 500000).toISOString(),
    createdAt: new Date(Date.now() - 500000),
  },
  {
    _id: 'fb-12',
    studentName: 'Katherine Marlowe',
    studentEmail: 'marlowe@hermetic.co.uk',
    studentDepartment: 'COMPS',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'Order and history examined.',
    timestamp: new Date(Date.now() - 400000).toISOString(),
    createdAt: new Date(Date.now() - 400000),
  },
  {
    _id: 'fb-13',
    studentName: 'Talbot Hermetic',
    studentEmail: 'talbot@hermetic.co.uk',
    studentDepartment: 'MECH',
    labId: 'a',
    tableId: 'a-p1',
    rating: 3,
    comment: 'Cipher decoded.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 300000),
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
  // Ensure all default users exist even across hot-reloads
  defaultUsers.forEach((u) => {
    if (!g.__unchartedStore!.users.has(u.email)) {
      g.__unchartedStore!.users.set(u.email, u);
    }
  });
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
