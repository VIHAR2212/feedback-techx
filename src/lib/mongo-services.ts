// MongoDB-backed implementation of the feedback/user services.
//
// Shape of the database (see scripts/setup-db.mjs for index creation):
//
//   feedback      one document per (explorer, product). The raw ledger.
//   users         one document per explorer, carrying denormalized
//                 leaderboard counters (feedbackCount / ratingSum /
//                 completedCount / rankScore).
//   productStats  one document per product (~26 rows), $inc-maintained.
//   eventStats    exactly one document, _id "global".
//
// The counter collections exist so that every read path an event audience
// hits every few seconds is O(1) or O(top-N): no collection scans, no
// $lookup joins, no distinct-email sets. All heavy work happens once, on
// the write, which is naturally spread across the event.

import { Db, MongoServerError, UpdateFilter } from 'mongodb';
import { getDatabase } from './mongodb';
import { DuplicateFeedbackError } from './errors';
import {
  FeedbackEntry,
  ExpeditionUser,
  PaginatedFeedbackResult,
  LeaderboardEntry,
  ProductStatsDoc,
  EventStatsDoc,
  computeRankScore,
} from './models';
import { LABS } from './mock-data';

const FEEDBACK_COLLECTION = 'feedback';
const USERS_COLLECTION = 'users';
const PRODUCT_STATS_COLLECTION = 'productStats';
const EVENT_STATS_COLLECTION = 'eventStats';
const EVENT_STATS_ID = 'global';
const LAB_ORDER = LABS.map((l) => l.labId);

type UserDoc = ExpeditionUser & { _id?: unknown };

let setupPromise: Promise<void> | null = null;
let dbInstance: Promise<Db> | null = null;

function getDb(): Promise<Db> {
  if (!dbInstance) {
    dbInstance = getDatabase();
  }
  return dbInstance;
}

// ---------- One-time setup ----------
//
// Index creation used to run on every cold start, alongside two
// countDocuments() calls and a demo-data seed. During a live event that is
// hundreds of wasted operations against a shared-CPU M0 — and the seed
// would inject fictional explorers into a real leaderboard. Both are now
// opt-in; the real setup lives in `npm run db:setup`, run once before the
// event.

const AUTO_SETUP =
  process.env.AUTO_DB_SETUP === 'true' || process.env.NODE_ENV !== 'production';
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === 'true';

async function doSetup(db: Db): Promise<void> {
  if (!AUTO_SETUP) return;

  // One command, one round trip — not six sequential createIndex calls.
  await db.collection(FEEDBACK_COLLECTION).createIndexes([
    { key: { studentEmail: 1, tableId: 1 }, name: 'uniq_email_table', unique: true },
    { key: { submissionId: 1 }, name: 'uniq_submission', unique: true, sparse: true },
    { key: { timestamp: -1 }, name: 'ts_desc' },
    { key: { tableId: 1, timestamp: -1 }, name: 'table_ts' },
    { key: { studentDepartment: 1, timestamp: -1 }, name: 'dept_ts' },
  ]);
  await db.collection(USERS_COLLECTION).createIndexes([
    { key: { email: 1 }, name: 'uniq_email', unique: true },
    { key: { rankScore: -1, updatedAt: 1 }, name: 'rank' },
  ]);

  if (!SEED_DEMO_DATA) return;

  const [userCount, feedbackCount] = await Promise.all([
    db.collection(USERS_COLLECTION).estimatedDocumentCount(),
    db.collection(FEEDBACK_COLLECTION).estimatedDocumentCount(),
  ]);
  if (userCount === 0 && feedbackCount === 0) {
    const { defaultUsers, defaultFeedback } = await import('./seed-data');
    await db
      .collection(USERS_COLLECTION)
      .insertMany(defaultUsers.map((u) => ({ ...u })) as object[]);
    const seedFeedback = defaultFeedback.map(({ _id, ...rest }) => ({ ...rest }));
    await db.collection(FEEDBACK_COLLECTION).insertMany(seedFeedback as object[]);
  }
}

export function ensureSetup(db: Db): Promise<void> {
  if (!setupPromise) {
    setupPromise = doSetup(db).catch((err) => {
      setupPromise = null; // allow retry on next request
      throw err;
    });
  }
  return setupPromise;
}

async function collection(name: string) {
  const db = await getDb();
  return { col: db.collection(name), db };
}

// ---------- Feedback (write path) ----------

/**
 * Insert one feedback row.
 *
 * Optimistic insert: we do NOT pre-read to check for duplicates. The unique
 * indexes are the source of truth, so the happy path is a single round trip
 * and concurrent submits from the same explorer can never both win. Only a
 * rejected insert pays for a lookup.
 *
 * `created` tells the caller whether counters should be bumped — an
 * idempotent replay of the same submissionId must not double-count.
 */
export async function saveFeedback(
  feedback: Omit<FeedbackEntry, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<{ entry: FeedbackEntry; created: boolean }> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const doc = { ...feedback, createdAt: feedback.createdAt ?? new Date() };

  try {
    await col.insertOne(doc as object & { _id?: never });
    return { entry: doc as FeedbackEntry, created: true };
  } catch (err) {
    const code = (err as MongoServerError).code;
    if (code !== 11000) throw err;

    // Same submissionId replayed (offline queue retry, double tap, flaky
    // network): return the stored row and report it as not newly created.
    if (feedback.submissionId) {
      const found = await col.findOne({ submissionId: feedback.submissionId });
      if (found) return { entry: stripId(found) as FeedbackEntry, created: false };
    }
    // Genuinely a second rating for the same product by the same explorer.
    throw new DuplicateFeedbackError();
  }
}

/**
 * Apply one submission to the event-wide counter collections.
 *
 * The two updates touch different collections and neither depends on the
 * other, so they cost one round trip of latency rather than two.
 */
export async function applyFeedbackCounters(entry: FeedbackEntry): Promise<void> {
  const db = await getDb();
  const rating = Number(entry.rating) || 0;
  const tier = Math.max(1, Math.min(5, Math.round(rating)));
  const hasComment = Boolean(entry.comment && entry.comment.trim() !== '');
  const when = entry.createdAt ?? new Date();

  const productInc: NonNullable<UpdateFilter<ProductStatsDoc>['$inc']> = {
    totalRatings: 1,
    ratingSum: rating,
    totalComments: hasComment ? 1 : 0,
  };
  // The distribution bucket is chosen at runtime; `tier` is already clamped
  // to 1..5, so the key is always one of r1..r5.
  productInc[`r${tier}` as 'r1'] = 1;

  await Promise.all([
    db.collection<ProductStatsDoc>(PRODUCT_STATS_COLLECTION).updateOne(
      { _id: entry.tableId },
      {
        $inc: productInc,
        $max: { lastRated: when },
        $setOnInsert: { labId: entry.labId ?? undefined },
      },
      { upsert: true }
    ),
    db.collection<EventStatsDoc>(EVENT_STATS_COLLECTION).updateOne(
      { _id: EVENT_STATS_ID },
      { $inc: { totalFeedback: 1, ratingSum: rating } },
      { upsert: true }
    ),
  ]);
}

// ---------- Feedback (read path) ----------

export async function getFeedback(
  filters: {
    email?: string;
    productId?: string;
    department?: string;
    limit?: number;
  } = {}
): Promise<FeedbackEntry[]> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const query: Record<string, string> = {};
  if (filters.email) query.studentEmail = filters.email;
  if (filters.productId) query.tableId = filters.productId;
  if (filters.department) query.studentDepartment = filters.department;

  // Hard ceiling: an unfiltered find() over a live event collection would
  // stream hundreds of thousands of rows into a lambda and OOM it.
  const limit = Math.min(filters.limit ?? 5000, 20000);

  const docs = await col.find(query).sort({ timestamp: -1 }).limit(limit).toArray();
  return docs.map((d) => stripId(d)) as FeedbackEntry[];
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
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const query: Record<string, unknown> = {};
  if (filters.email) query.studentEmail = filters.email;
  if (filters.productId) query.tableId = filters.productId;
  if (filters.department) query.studentDepartment = filters.department;
  // Keyset pagination only. `skip` was O(n) — page 500 of the admin ledger
  // would have made Mongo walk half a million documents to throw them away.
  if (filters.cursor) query.timestamp = { $lt: filters.cursor };

  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const docs = await col
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = docs.length > limit;
  const items = (hasMore ? docs.slice(0, limit) : docs).map((d) =>
    stripId(d)
  ) as FeedbackEntry[];
  const nextCursor =
    hasMore && items.length > 0 ? String(items[items.length - 1].timestamp) : null;

  return { items, nextCursor, hasMore };
}

/**
 * Event-wide totals. Two cheap reads instead of the old aggregation, which
 * grouped the entire feedback collection and built an $addToSet array of
 * every distinct explorer email just to take its .length.
 */
export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  const db = await getDb();
  await ensureSetup(db);

  const [event, totalUsers] = await Promise.all([
    db.collection<EventStatsDoc>(EVENT_STATS_COLLECTION).findOne({ _id: EVENT_STATS_ID }),
    // estimatedDocumentCount reads collection metadata instead of counting —
    // O(1) rather than a scan of every explorer document.
    db.collection(USERS_COLLECTION).estimatedDocumentCount(),
  ]);

  const totalFeedback = event?.totalFeedback ?? 0;
  const ratingSum = event?.ratingSum ?? 0;

  return {
    totalUsers,
    totalFeedback,
    averageRating: totalFeedback > 0 ? Number((ratingSum / totalFeedback).toFixed(2)) : 0,
  };
}

// ---------- Users / expedition progress ----------

/**
 * Record a completed product for one explorer and refresh their counters.
 *
 * Two round trips at most:
 *   1. one atomic upsert that adds the product, bumps the running totals
 *      and returns the resulting document;
 *   2. a follow-up $set only when the derived fields (shards, unlocks,
 *      rankScore) actually changed.
 *
 * Nothing here reads the feedback collection, so cost is independent of how
 * many submissions the event has taken.
 */
export async function updateUserProgress(
  email: string,
  productId: string,
  info?: { name?: string; department?: string; rating?: number; countRating?: boolean }
): Promise<ExpeditionUser> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);

  const countRating = info?.countRating !== false;
  const rating = Number(info?.rating) || 0;
  const now = new Date();

  // A replayed submission still confirms the product, but must not move the
  // average — so the increments go to zero rather than the operator being
  // dropped (keeping one static update shape the driver can type).
  const inc = countRating
    ? { feedbackCount: 1, ratingSum: rating }
    : { feedbackCount: 0, ratingSum: 0 };

  const user = (await col.findOneAndUpdate(
    { email },
    {
      $addToSet: { completedProducts: productId },
      $inc: inc,
      $set: { updatedAt: now },
      // `email` is omitted deliberately: an equality filter seeds the new
      // document with it already, and repeating it here can trip Mongo's
      // conflicting-path check.
      $setOnInsert: {
        name: info?.name ?? '',
        department: info?.department ?? '',
        unlockedLabs: [LAB_ORDER[0]],
        completedLabs: [],
        shards: [],
        discoveredClues: [],
        discoveredTreasures: [],
      },
    },
    { upsert: true, returnDocument: 'after' }
  )) as UserDoc | null;

  if (!user) throw new Error('Failed to upsert explorer progress');

  user.completedProducts ??= [];
  user.unlockedLabs ??= [LAB_ORDER[0]];
  user.completedLabs ??= [];
  user.shards ??= [];

  const patch: Record<string, unknown> = {};
  if (info?.name && !user.name) patch.name = user.name = info.name;
  if (info?.department && !user.department) {
    patch.department = user.department = info.department;
  }

  // Re-evaluate per-lab completion + shards + unlocks.
  let progressChanged = false;
  for (const lab of LABS) {
    if (user.completedLabs.includes(lab.labId)) continue;
    const allDone = lab.products.every((p) => user.completedProducts.includes(p.id));
    if (allDone) {
      user.completedLabs.push(lab.labId);
      if (!user.shards.includes(lab.labId)) user.shards.push(lab.labId);
      const next = LAB_ORDER[LAB_ORDER.indexOf(lab.labId) + 1];
      if (next && !user.unlockedLabs.includes(next)) user.unlockedLabs.push(next);
      progressChanged = true;
    }
  }
  if (progressChanged) {
    patch.completedLabs = user.completedLabs;
    patch.shards = user.shards;
    patch.unlockedLabs = user.unlockedLabs;
  }

  const isCompleted = user.shards.length >= LAB_ORDER.length;
  if (isCompleted && !user.completionDate) {
    patch.completionDate = user.completionDate = now.toISOString();
  }

  // Recompute the sort key from the values we just read back. Deriving it
  // here (rather than $inc-ing it) makes it self-healing: a counter that
  // drifts is corrected by the explorer's next submission.
  const feedbackCount = user.feedbackCount ?? 0;
  const completedCount = user.completedProducts.length;
  const averageRating = feedbackCount > 0 ? (user.ratingSum ?? 0) / feedbackCount : 0;
  const rankScore = computeRankScore({ isCompleted, completedCount, averageRating });

  if (
    user.rankScore !== rankScore ||
    user.completedCount !== completedCount ||
    user.isCompleted !== isCompleted
  ) {
    patch.rankScore = user.rankScore = rankScore;
    patch.completedCount = user.completedCount = completedCount;
    patch.isCompleted = user.isCompleted = isCompleted;
  }

  if (Object.keys(patch).length > 0) {
    await col.updateOne({ email }, { $set: patch });
  }

  return stripId(user);
}

export async function getAllUsers(limit = 20000): Promise<Array<ExpeditionUser>> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);
  const docs = await col.find({}).limit(limit).toArray();
  return docs.map((d) => stripId(d)) as Array<ExpeditionUser>;
}

export async function getAllFeedback(limit = 20000): Promise<FeedbackEntry[]> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);
  const docs = await col.find({}).limit(limit).toArray();
  return docs.map((d) => stripId(d)) as FeedbackEntry[];
}

/**
 * Top-N leaderboard.
 *
 * An index scan over { rankScore: -1, updatedAt: 1 } reading exactly
 * `limit` documents. The previous implementation $lookup-joined every user
 * against the whole feedback collection with no limit — with 20k explorers
 * and a few hundred thousand ratings that is a full cross-product scan on
 * shared M0 CPU, and it will simply time out.
 *
 * updatedAt ascending breaks ties so the board does not shuffle between two
 * identical scores on every 5-second poll.
 */
export async function getLeaderboardAggregated(limit = 50): Promise<LeaderboardEntry[]> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);

  const capped = Math.min(Math.max(limit, 1), 200);
  const docs = await col
    .find(
      {},
      {
        projection: {
          _id: 0,
          name: 1,
          email: 1,
          department: 1,
          completedProducts: 1,
          unlockedLabs: 1,
          completedLabs: 1,
          shards: 1,
          completionDate: 1,
          isCompleted: 1,
          feedbackCount: 1,
          ratingSum: 1,
          completedCount: 1,
        },
      }
    )
    .sort({ rankScore: -1, updatedAt: 1 })
    .limit(capped)
    .toArray();

  return docs.map((d) => {
    const feedbackCount = (d.feedbackCount as number) ?? 0;
    const ratingSum = (d.ratingSum as number) ?? 0;
    return {
      name: d.name ?? '',
      email: d.email ?? '',
      department: d.department ?? '',
      completedProducts: d.completedProducts ?? [],
      unlockedLabs: d.unlockedLabs ?? [],
      completedLabs: d.completedLabs ?? [],
      shards: d.shards ?? [],
      discoveredClues: [],
      discoveredTreasures: [],
      completionDate: d.completionDate ?? undefined,
      totalRating: ratingSum,
      averageRating: feedbackCount > 0 ? Number((ratingSum / feedbackCount).toFixed(2)) : 0,
      isCompleted: Boolean(d.isCompleted),
    } as LeaderboardEntry;
  });
}

/**
 * Per-product rating breakdown — a scan of the ~26-row counter collection,
 * not a $group over every feedback document ever written.
 */
export async function getProductStatsAggregated(): Promise<
  Array<{
    productId: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    totalComments: number;
    lastRated: string | null;
  }>
> {
  const db = await getDb();
  await ensureSetup(db);

  const docs = await db
    .collection<ProductStatsDoc>(PRODUCT_STATS_COLLECTION)
    .find({})
    .toArray();

  return docs.map((d) => {
    const total = d.totalRatings ?? 0;
    const last = d.lastRated;
    return {
      productId: String(d._id),
      totalRatings: total,
      averageRating: total > 0 ? Number(((d.ratingSum ?? 0) / total).toFixed(2)) : 0,
      ratingDistribution: {
        1: d.r1 ?? 0,
        2: d.r2 ?? 0,
        3: d.r3 ?? 0,
        4: d.r4 ?? 0,
        5: d.r5 ?? 0,
      },
      totalComments: d.totalComments ?? 0,
      lastRated: last
        ? last instanceof Date
          ? last.toISOString()
          : new Date(last).toISOString()
        : null,
    };
  });
}

/** Number of explorers who have finished every sector. */
export async function getCompletedUserCount(): Promise<number> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);
  // rankScore >= 1e9 is exactly the "isCompleted" half of the score, so this
  // is answered by the same index the leaderboard uses.
  return col.countDocuments({ rankScore: { $gte: 1_000_000_000 } });
}

function stripId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}
