// Uncharted Expedition — services layer (facade).
//
// Primary persistence is MongoDB (mongo-services.ts). If MongoDB is
// unreachable — e.g. local dev without a mongod, or a transient outage —
// every call transparently falls back to the in-memory store so the site
// keeps working. Callers don't know or care which backend served them.

import { DuplicateFeedbackError } from './errors';
import * as mongo from './mongo-services';
import { memoryStore } from './mock-store';
import { LAB_ORDER, getLabById, CLUE_POOL, TREASURE_POOL } from './mock-data';
import { FeedbackEntry, ExpeditionUser } from './models';

export { DuplicateFeedbackError };

export type StoreBackend = 'mongodb' | 'memory';

let warnedBackend: string | null = null;

function warnOnce(backend: StoreBackend, err: unknown) {
  if (warnedBackend !== backend) {
    warnedBackend = backend;
    console.warn(
      `[store] Falling back to ${backend} store:`,
      err instanceof Error ? err.message : err
    );
  }
}

async function withMongo<T>(op: () => Promise<T>): Promise<T | null> {
  try {
    return await op();
  } catch (err) {
    warnOnce('memory', err);
    return null;
  }
}

// ---------- Feedback ----------

export async function saveFeedback(
  feedback: Omit<FeedbackEntry, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<FeedbackEntry> {
  const saved = await withMongo(() => mongo.saveFeedback(feedback));
  if (saved) return saved;

  const duplicate = memoryStore.feedback.some(
    (f) => f.studentEmail === feedback.studentEmail && f.tableId === feedback.tableId
  );
  if (duplicate) throw new DuplicateFeedbackError();

  const doc = { ...feedback, createdAt: feedback.createdAt ?? new Date() };
  memoryStore.feedback.push(doc);
  return doc;
}

export async function getFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
} = {}): Promise<FeedbackEntry[]> {
  const result = await withMongo(() => mongo.getFeedback(filters));
  if (result) return result;

  let out = memoryStore.feedback.slice();
  if (filters.email) out = out.filter((f) => f.studentEmail === filters.email);
  if (filters.productId) out = out.filter((f) => f.tableId === filters.productId);
  if (filters.department) out = out.filter((f) => f.studentDepartment === filters.department);
  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return out;
}

export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  const stats = await withMongo(() => mongo.getFeedbackStats());
  if (stats) return stats;

  const totalFeedback = memoryStore.feedback.length;
  const uniqueEmails = new Set(memoryStore.feedback.map((f) => f.studentEmail));
  const avg =
    totalFeedback > 0
      ? memoryStore.feedback.reduce((s, f) => s + f.rating, 0) / totalFeedback
      : 0;
  return {
    totalUsers: uniqueEmails.size,
    totalFeedback,
    averageRating: Number(avg.toFixed(2)),
  };
}

// ---------- User / expedition progress ----------

function applyProgressRules(user: ExpeditionUser): void {
  for (const labId of LAB_ORDER) {
    if (user.completedLabs.includes(labId)) continue;
    const lab = getLabById(labId);
    if (!lab) continue;
    const allDone = lab.products.every((p) => user.completedProducts.includes(p.id));
    if (allDone) {
      user.completedLabs.push(labId);
      if (!user.shards.includes(labId)) user.shards.push(labId);
      const idx = LAB_ORDER.indexOf(labId);
      if (idx + 1 < LAB_ORDER.length) {
        const next = LAB_ORDER[idx + 1];
        if (!user.unlockedLabs.includes(next)) user.unlockedLabs.push(next);
      }
    }
  }
  if (user.shards.length >= LAB_ORDER.length && !user.completionDate) {
    user.completionDate = new Date().toISOString();
  }
}

export async function updateUserProgress(
  email: string,
  productId: string,
  info?: { name?: string; department?: string }
): Promise<ExpeditionUser> {
  const updated = await withMongo(() => mongo.updateUserProgress(email, productId, info));
  if (updated) return updated;

  let user = memoryStore.users.get(email);
  if (!user) {
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
    memoryStore.users.set(email, user);
    return user;
  }

  if (info?.name && !user.name) user.name = info.name;
  if (info?.department && !user.department) user.department = info.department;
  if (!user.completedProducts.includes(productId)) {
    user.completedProducts.push(productId);
  }
  applyProgressRules(user);
  return user;
}

export type LeaderboardEntry = ExpeditionUser & {
  totalRating: number;
  averageRating: number;
  isCompleted: boolean;
};

function rank(users: ExpeditionUser[], allFeedback: FeedbackEntry[]): LeaderboardEntry[] {
  return users
    .map((user) => {
      const feedback = allFeedback.filter((f) => f.studentEmail === user.email);
      const totalRating = feedback.reduce((s, f) => s + f.rating, 0);
      const averageRating = feedback.length > 0 ? totalRating / feedback.length : 0;
      return {
        ...user,
        totalRating,
        averageRating,
        isCompleted: user.shards.length >= LAB_ORDER.length,
      };
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return b.isCompleted ? 1 : -1;
      if (a.completedProducts.length !== b.completedProducts.length)
        return b.completedProducts.length - a.completedProducts.length;
      return b.averageRating - a.averageRating;
    });
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await withMongo(async () =>
    rank(await mongo.getAllUsers(), await mongo.getAllFeedback())
  );
  if (users) return users;

  return rank(
    Array.from(memoryStore.users.values()),
    memoryStore.feedback.slice()
  );
}

// ---------- Expedition extras ----------

// Random clue reveal — 50% chance to return a clue, 50% to return null.
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

// Optional treasure hunt — always returns a treasure (some are duds).
export async function rollForTreasure(): Promise<{
  treasure: typeof TREASURE_POOL[number];
}> {
  const idx = Math.floor(Math.random() * TREASURE_POOL.length);
  return { treasure: TREASURE_POOL[idx] };
}
