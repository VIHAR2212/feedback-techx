// Uncharted Expedition — services layer (MOCK implementation).
//
// Every public function here mirrors the signature of the original
// MongoDB-backed services.ts so seniors can swap implementations:
//   1. Replace the body of each function with a Prisma/Mongo call.
//   2. Delete the mock-store import.
//   3. Pages, components and API routes will keep working unchanged.

import { mockStore, getMockLabs } from './mock-store';
import {
  FeedbackEntry,
  ExpeditionUser,
  Lab,
  Admin,
  GemstoneTier,
  CertificateShard,
  FinalCertificate,
} from './models';
import {
  ADMIN_SEED,
  LAB_ORDER,
  getLabById,
  getProductById,
  getShardInscription,
  CLUE_POOL,
  TREASURE_POOL,
} from './mock-data';

// ---------- Feedback ----------

export async function saveFeedback(
  feedback: Omit<FeedbackEntry, '_id'>
): Promise<FeedbackEntry> {
  const feedbackWithTimestamp = {
    ...feedback,
    createdAt: new Date(),
  };
  mockStore.feedback.push(feedbackWithTimestamp);
  return feedbackWithTimestamp;
}

export async function getFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
} = {}): Promise<FeedbackEntry[]> {
  let result = mockStore.feedback.slice();
  if (filters.email) {
    result = result.filter((f) => f.studentEmail === filters.email);
  }
  if (filters.productId) {
    result = result.filter((f) => f.tableId === filters.productId);
  }
  if (filters.department) {
    result = result.filter((f) => f.studentDepartment === filters.department);
  }
  result.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return result;
}

export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  const totalFeedback = mockStore.feedback.length;
  const uniqueEmails = new Set(mockStore.feedback.map((f) => f.studentEmail));
  const totalUsers = uniqueEmails.size;
  const avg =
    totalFeedback > 0
      ? mockStore.feedback.reduce((s, f) => s + f.rating, 0) / totalFeedback
      : 0;
  return {
    totalUsers,
    totalFeedback,
    averageRating: Number(avg.toFixed(2)),
  };
}

// ---------- User / expedition progress ----------
//
// In the original project this function only updated `completedFeedback`.
// Here it also recomputes unlocked labs + earned certificate shards, so the
// skeleton enforces the linear Uncharted flow: A -> B -> C, shard per lab,
// final certificate when 3 shards collected.
//
// `info` is optional extra user data captured from the landing page /
// feedback payload. When provided, it back-fills name + department on the
// stored user record so the leaderboard shows real explorer names.

export async function updateUserProgress(
  email: string,
  productId: string,
  info?: { name?: string; department?: string }
): Promise<ExpeditionUser> {
  let user = mockStore.users.get(email);
  if (!user) {
    // Create new expedition user — first lab unlocked.
    user = {
      name: info?.name ?? '',
      email,
      department: info?.department ?? '',
      completedProducts: [productId],
      unlockedLabs: ['a'],
      completedLabs: [],
      shards: [],
      discoveredClues: [],
      discoveredTreasures: [],
    };
    mockStore.users.set(email, user);
    return user;
  }

  // Back-fill name/department if missing (e.g. user was created by an
  // earlier submission that didn't include them).
  if (info?.name && !user.name) user.name = info.name;
  if (info?.department && !user.department) user.department = info.department;

  if (!user.completedProducts.includes(productId)) {
    user.completedProducts.push(productId);
  }

  // Re-evaluate per-lab completion + shards.
  for (const labId of LAB_ORDER) {
    if (user.completedLabs.includes(labId)) continue;
    const lab = getLabById(labId);
    if (!lab) continue;
    const allDone = lab.products.every((p) =>
      user!.completedProducts.includes(p.id)
    );
    if (allDone) {
      user.completedLabs.push(labId);
      if (!user.shards.includes(labId)) user.shards.push(labId);
      // Unlock next lab in linear order.
      const idx = LAB_ORDER.indexOf(labId);
      if (idx + 1 < LAB_ORDER.length) {
        const next = LAB_ORDER[idx + 1];
        if (!user.unlockedLabs.includes(next)) user.unlockedLabs.push(next);
      }
    }
  }

  // Final expedition completion.
  if (
    user.shards.length >= LAB_ORDER.length &&
    !user.completionDate
  ) {
    user.completionDate = new Date().toISOString();
  }

  return user;
}

export async function getLeaderboard(): Promise<
  Array<
    ExpeditionUser & {
      totalRating: number;
      averageRating: number;
      isCompleted: boolean;
    }
  >
> {
  const users = Array.from(mockStore.users.values());
  return users
    .map((user) => {
      const feedback = mockStore.feedback.filter(
        (f) => f.studentEmail === user.email
      );
      const totalRating = feedback.reduce((s, f) => s + f.rating, 0);
      const averageRating =
        feedback.length > 0 ? totalRating / feedback.length : 0;
      return {
        ...user,
        totalRating,
        averageRating,
        isCompleted: user.shards.length >= LAB_ORDER.length,
      };
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted)
        return b.isCompleted ? 1 : -1;
      if (a.completedProducts.length !== b.completedProducts.length)
        return b.completedProducts.length - a.completedProducts.length;
      return b.averageRating - a.averageRating;
    });
}

// ---------- Labs ----------

export async function getLabs(): Promise<Lab[]> {
  return getMockLabs();
}

export async function initializeLabs(): Promise<void> {
  // Labs are static in the mock; nothing to seed. Function kept for parity
  // with the original signature (and the /api/init route).
}

// ---------- Admin ----------

export async function getAdmin(username: string): Promise<Admin | null> {
  const a = mockStore.admins.find((ad) => ad.username === username);
  return a ? { ...a } : null;
}

export async function initializeAdmin(): Promise<void> {
  if (mockStore.admins.length === 0) {
    mockStore.admins.push({
      ...ADMIN_SEED,
      createdAt: new Date(),
    });
  }
}

// ---------- Expedition extras (NEW for Uncharted) ----------

// Random clue reveal — 50% chance to return a clue, 50% to return null.
// Clue is drawn from the lab the user just submitted feedback for.
export async function rollForClue(
  labId: string
): Promise<{ clue: typeof CLUE_POOL[number] | null }> {
  const labClues = CLUE_POOL.filter((c) => c.labId === labId);
  const pool = labClues.length > 0 ? labClues : CLUE_POOL;
  const roll = Math.random();
  if (roll < 0.5) return { clue: null };
  const idx = Math.floor(Math.random() * pool.length);
  return { clue: pool[idx] };
}

// Optional treasure hunt — always returns a treasure (some are "empty cache"
// duds). Seniors can swap for an actual DB-backed treasure table.
export async function rollForTreasure(): Promise<{
  treasure: typeof TREASURE_POOL[number];
}> {
  const idx = Math.floor(Math.random() * TREASURE_POOL.length);
  return { treasure: TREASURE_POOL[idx] };
}

// Build a certificate shard payload for a completed lab. Used by both the
// certificate-shard view and the final certificate.
export function buildShardForLab(
  labId: string,
  earnedAt: string = new Date().toISOString()
): CertificateShard | null {
  const lab = getLabById(labId);
  if (!lab) return null;
  const shardNumber = (LAB_ORDER.indexOf(labId) + 1) as 1 | 2 | 3;
  return {
    labId: lab.labId,
    labName: lab.labName,
    shardNumber,
    earnedAt,
    inscription: getShardInscription(labId),
  };
}

// Build the final certificate once all three shards are collected.
export function buildFinalCertificate(
  user: ExpeditionUser
): FinalCertificate | null {
  if (user.shards.length < LAB_ORDER.length) return null;
  return {
    expeditionName: 'Uncharted Expedition',
    explorerName: user.name,
    explorerEmail: user.email,
    explorerDepartment: user.department,
    issuedAt: user.completionDate ?? new Date().toISOString(),
    shardInscriptions: LAB_ORDER.map((id) => getShardInscription(id)),
  };
}

// Lookup helpers (re-exported so callers don't need to know about mock-data)
export { getLabById, getProductById, LAB_ORDER };

export type { GemstoneTier };
