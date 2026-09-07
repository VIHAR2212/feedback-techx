// Uncharted Expedition — services layer (facade).
//
// Primary persistence is MongoDB (mongo-services.ts). If MongoDB is
// unreachable — e.g. local dev without a mongod, or a transient outage —
// every call transparently falls back to the in-memory store so the site
// keeps working. Callers don't know or care which backend served them.
//
// Read paths that the event audience polls (leaderboard, product stats,
// event stats) go through a short in-process cache with single-flight
// de-duplication. Combined with the CDN cache headers on the route
// handlers, a stampede of thousands of 5-second polls becomes roughly one
// MongoDB query per interval.

import { DuplicateFeedbackError } from './errors';
import * as mongo from './mongo-services';
import { memoryStore } from './mock-store';
import { LAB_ORDER, getLabById, CLUE_POOL, TREASURE_POOL } from './mock-data';
import { cached, invalidate, CacheKeys } from './cache';
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

// Slightly under the client poll interval so a poll that misses the CDN
// still tends to find a warm value rather than hitting Mongo.
const LEADERBOARD_TTL_MS = 4_000;
const PRODUCT_STATS_TTL_MS = 8_000;
const EVENT_STATS_TTL_MS = 8_000;

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
    // A duplicate is a real business outcome, not a backend failure — it
    // must not silently re-route the write into the in-memory store.
    if (err instanceof DuplicateFeedbackError) throw err;
    warnOnce('memory', err);
    return null;
  }
}

// ---------- Feedback ----------

/**
 * Submit one rating: writes the ledger row, updates the explorer's
 * progress, and folds the rating into the per-product and event-wide
 * counters — all from a single call so the counters can never be bumped
 * twice for one idempotent replay.
 */
export async function submitFeedback(
  feedback: Omit<FeedbackEntry, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<{ entry: FeedbackEntry; created: boolean; user: ExpeditionUser }> {
  const saved = await saveFeedback(feedback);

  const user = await updateUserProgress(feedback.studentEmail, feedback.tableId, {
    name: saved.entry.studentName,
    department: saved.entry.studentDepartment,
    rating: Number(saved.entry.rating) || 0,
    // A replayed submissionId must not double-count towards the average.
    countRating: saved.created,
  });

  if (saved.created) {
    await withMongo(() => mongo.applyFeedbackCounters(saved.entry));
    // The explorer expects to see their own submission on the next poll.
    invalidate(CacheKeys.productStats);
    invalidate(CacheKeys.eventStats);
  }

  return { ...saved, user };
}

export async function saveFeedback(
  feedback: Omit<FeedbackEntry, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<{ entry: FeedbackEntry; created: boolean }> {
  const saved = await withMongo(() => mongo.saveFeedback(feedback));
  if (saved) return saved;

  if (feedback.submissionId) {
    const existing = memoryStore.feedback.find(
      (f) => f.submissionId === feedback.submissionId
    );
    if (existing) return { entry: existing, created: false };
  }

  const duplicate = memoryStore.feedback.find(
    (f) => f.studentEmail === feedback.studentEmail && f.tableId === feedback.tableId
  );
  if (duplicate) throw new DuplicateFeedbackError();

  const doc = { ...feedback, createdAt: feedback.createdAt ?? new Date() };
  memoryStore.feedback.push(doc);
  return { entry: doc, created: true };
}

export async function getFeedback(
  filters: {
    email?: string;
    productId?: string;
    department?: string;
    limit?: number;
  } = {}
): Promise<FeedbackEntry[]> {
  const result = await withMongo(() => mongo.getFeedback(filters));
  if (result) return result;

  let out = memoryStore.feedback.slice();
  if (filters.email) out = out.filter((f) => f.studentEmail === filters.email);
  if (filters.productId) out = out.filter((f) => f.tableId === filters.productId);
  if (filters.department) out = out.filter((f) => f.studentDepartment === filters.department);
  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return out.slice(0, Math.min(filters.limit ?? 5000, 20000));
}

export async function getPaginatedFeedback(
  filters: {
    email?: string;
    productId?: string;
    department?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<PaginatedFeedbackResult> {
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

  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const hasMore = out.length > limit;
  const items = hasMore ? out.slice(0, limit) : out;
  const nextCursor =
    hasMore && items.length > 0 ? String(items[items.length - 1].timestamp) : null;

  return { items, nextCursor, hasMore, total: memoryStore.feedback.length };
}

export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  return cached(CacheKeys.eventStats, EVENT_STATS_TTL_MS, async () => {
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
  });
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
  info?: { name?: string; department?: string; rating?: number; countRating?: boolean }
): Promise<ExpeditionUser> {
  const updated = await withMongo(() => mongo.updateUserProgress(email, productId, info));
  if (updated) return updated;

  let user = memoryStore.users.get(email);
  if (!user) {
    user = {
      name: info?.name ?? '',
      email,
      department: info?.department ?? '',
      completedProducts: [],
      unlockedLabs: [LAB_ORDER[0]],
      completedLabs: [],
      shards: [],
      discoveredClues: [],
      discoveredTreasures: [],
      feedbackCount: 0,
      ratingSum: 0,
    };
    memoryStore.users.set(email, user);
  }

  if (info?.name && !user.name) user.name = info.name;
  if (info?.department && !user.department) user.department = info.department;
  if (!user.completedProducts.includes(productId)) {
    user.completedProducts.push(productId);
  }
  if (info?.countRating !== false) {
    user.feedbackCount = (user.feedbackCount ?? 0) + 1;
    user.ratingSum = (user.ratingSum ?? 0) + (Number(info?.rating) || 0);
  }
  applyProgressRules(user);
  user.completedCount = user.completedProducts.length;
  user.isCompleted = user.shards.length >= LAB_ORDER.length;
  return user;
}

function rank(users: ExpeditionUser[]): LeaderboardEntry[] {
  return users
    .map((user) => {
      const count = user.feedbackCount ?? 0;
      const totalRating = user.ratingSum ?? 0;
      return {
        ...user,
        totalRating,
        averageRating: count > 0 ? Number((totalRating / count).toFixed(2)) : 0,
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

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const capped = Math.min(Math.max(limit, 1), 200);

  return cached(CacheKeys.leaderboard(capped), LEADERBOARD_TTL_MS, async () => {
    const users = await withMongo(() => mongo.getLeaderboardAggregated(capped));
    if (users) return users;

    return rank(Array.from(memoryStore.users.values())).slice(0, capped);
  });
}

export async function getProductStats(): Promise<
  Array<{
    productId: string;
    productName: string;
    labName: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    totalComments: number;
    lastRated: string | null;
  }>
> {
  return cached(CacheKeys.productStats, PRODUCT_STATS_TTL_MS, async () => {
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

    // In-memory fallback: recompute from the raw rows.
    const productStats = new Map<
      string,
      {
        productId: string;
        productName: string;
        labName: string;
        totalRatings: number;
        averageRating: number;
        ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
        totalComments: number;
        lastRated: string | null;
      }
    >();

    for (const feedback of memoryStore.feedback) {
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
  });
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const [stats, leaderboard, productStats, completedUsers] = await Promise.all([
    getFeedbackStats(),
    getLeaderboard(20),
    getProductStats(),
    // Counted with an indexed query rather than by filtering the top-20
    // slice, which only ever saw 20 explorers out of thousands.
    withMongo(() => mongo.getCompletedUserCount()),
  ]);

  return {
    stats: {
      totalUsers: stats.totalUsers,
      totalFeedback: stats.totalFeedback,
      completedUsers:
        completedUsers ??
        Array.from(memoryStore.users.values()).filter(
          (u) => u.shards.length >= LAB_ORDER.length
        ).length,
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
): Promise<{ clue: (typeof CLUE_POOL)[number] | null }> {
  const labClues = CLUE_POOL.filter((c) => c.labId === labId);
  const pool = labClues.length > 0 ? labClues : CLUE_POOL;
  const roll = Math.random();
  if (roll < 0.5) return { clue: null };
  const idx = Math.floor(Math.random() * pool.length);
  return { clue: pool[idx] };
}

// Optional treasure hunt — always returns a treasure (some are duds).
export async function rollForTreasure(): Promise<{
  treasure: (typeof TREASURE_POOL)[number];
}> {
  const idx = Math.floor(Math.random() * TREASURE_POOL.length);
  return { treasure: TREASURE_POOL[idx] };
}
