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
import {
  FeedbackEntry,
  ExpeditionUser,
  LeaderboardEntry,
  PaginatedFeedbackResult,
  DashboardData,
} from './models';

export { DuplicateFeedbackError };
export type { LeaderboardEntry };

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

  if (feedback.submissionId) {
    const existing = memoryStore.feedback.find((f) => f.submissionId === feedback.submissionId);
    if (existing) return existing;
  }

  const duplicate = memoryStore.feedback.some(
    (f) => f.studentEmail === feedback.studentEmail && f.tableId === feedback.tableId
  );
  if (duplicate) {
    const existing = memoryStore.feedback.find(
      (f) => f.studentEmail === feedback.studentEmail && f.tableId === feedback.tableId
    );
    if (existing && feedback.submissionId && existing.submissionId === feedback.submissionId) {
      return existing;
    }
    throw new DuplicateFeedbackError();
  }

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

export async function getPaginatedFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
  limit?: number;
  cursor?: string;
  page?: number;
} = {}): Promise<PaginatedFeedbackResult> {
  const result = await withMongo(() => mongo.getPaginatedFeedback(filters));
  if (result) return result;

  let out = memoryStore.feedback.slice();
  if (filters.email) out = out.filter((f) => f.studentEmail === filters.email);
  if (filters.productId) out = out.filter((f) => f.tableId === filters.productId);
  if (filters.department) out = out.filter((f) => f.studentDepartment === filters.department);
  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  if (filters.cursor) {
    out = out.filter((f) => String(f.timestamp) < filters.cursor!);
  }

  const limit = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 25;
  const skip = filters.page && filters.page > 1 ? (filters.page - 1) * limit : 0;
  if (skip > 0) {
    out = out.slice(skip);
  }
  const hasMore = out.length > limit;
  const items = hasMore ? out.slice(0, limit) : out;
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].timestamp) : null;

  return { items, nextCursor, hasMore, total: memoryStore.feedback.length };
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

export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const users = await withMongo(async () => mongo.getLeaderboardAggregated(limit));
  if (users) return users;

  const ranked = rank(
    Array.from(memoryStore.users.values()),
    memoryStore.feedback.slice()
  );
  return typeof limit === 'number' && limit > 0 ? ranked.slice(0, limit) : ranked;
}

export async function getProductStats(): Promise<Array<{
  productId: string;
  productName: string;
  labName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalComments: number;
  lastRated: string | null;
}>> {
  const { getProductLookup } = await import('./mock-store');
  const productMap = getProductLookup();

  const mongoStats = await withMongo(() => mongo.getProductStatsAggregated());
  if (mongoStats) {
    return mongoStats.map((st) => {
      const info = productMap.get(st.productId);
      return {
        ...st,
        productName: info?.name || st.productId,
        labName: info?.labName || 'Expedition Sector',
      };
    });
  }

  // In-memory fallback calculation
  const allFeedback = memoryStore.feedback;
  const productStats = new Map<string, {
    productId: string;
    productName: string;
    labName: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    totalComments: number;
    lastRated: string | null;
  }>();

  for (const feedback of allFeedback) {
    const info = productMap.get(feedback.tableId);
    if (!info) continue;
    if (!productStats.has(feedback.tableId)) {
      productStats.set(feedback.tableId, {
        productId: feedback.tableId,
        productName: info.name,
        labName: info.labName,
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        totalComments: 0,
        lastRated: null,
      });
    }
    const stats = productStats.get(feedback.tableId)!;
    stats.totalRatings++;
    const tier = Math.max(1, Math.min(5, feedback.rating)) as 1 | 2 | 3 | 4 | 5;
    stats.ratingDistribution[tier]++;
    if (feedback.comment && feedback.comment.trim() !== '') {
      stats.totalComments++;
    }
    const tsString =
      typeof feedback.timestamp === 'string'
        ? feedback.timestamp
        : new Date(feedback.timestamp).toISOString();
    if (!stats.lastRated || new Date(tsString) > new Date(stats.lastRated)) {
      stats.lastRated = tsString;
    }
  }

  for (const stats of productStats.values()) {
    if (stats.totalRatings > 0) {
      const sum =
        stats.ratingDistribution[1] * 1 +
        stats.ratingDistribution[2] * 2 +
        stats.ratingDistribution[3] * 3 +
        stats.ratingDistribution[4] * 4 +
        stats.ratingDistribution[5] * 5;
      stats.averageRating = Number((sum / stats.totalRatings).toFixed(2));
    }
  }

  return Array.from(productStats.values());
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const [stats, leaderboard, productStats] = await Promise.all([
    getFeedbackStats(),
    getLeaderboard(20),
    getProductStats(),
  ]);

  const completedUsers = leaderboard.filter((u) => u.isCompleted).length;

  return {
    stats: {
      totalUsers: stats.totalUsers,
      totalFeedback: stats.totalFeedback,
      completedUsers,
      averageRating: stats.averageRating,
    },
    leaderboard,
    productStats,
  };
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
