// MongoDB-backed implementation of the feedback/user services.
// Same shapes as the in-memory fallback: `feedback` and `users` collections
// mirror FeedbackEntry / ExpeditionUser. Seeded once from seed-data when
// both collections are empty.

import { Db } from 'mongodb';
import { getDatabase } from './mongodb';
import { DuplicateFeedbackError } from './errors';
import { FeedbackEntry, ExpeditionUser, PaginatedFeedbackResult, LeaderboardEntry } from './models';
import { defaultUsers, defaultFeedback } from './seed-data';
import { LABS } from './mock-data';

const FEEDBACK_COLLECTION = 'feedback';
const USERS_COLLECTION = 'users';
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

async function doSetup(db: Db): Promise<void> {
  await db
    .collection(FEEDBACK_COLLECTION)
    .createIndex({ studentEmail: 1, tableId: 1 }, { unique: true });
  await db
    .collection(FEEDBACK_COLLECTION)
    .createIndex({ submissionId: 1 }, { unique: true, sparse: true });
  await db
    .collection(FEEDBACK_COLLECTION)
    .createIndex({ timestamp: -1 });
  await db
    .collection(FEEDBACK_COLLECTION)
    .createIndex({ tableId: 1 });
  await db
    .collection(FEEDBACK_COLLECTION)
    .createIndex({ studentDepartment: 1 });
  await db.collection(USERS_COLLECTION).createIndex({ email: 1 }, { unique: true });

  const [userCount, feedbackCount] = await Promise.all([
    db.collection(USERS_COLLECTION).countDocuments(),
    db.collection(FEEDBACK_COLLECTION).countDocuments(),
  ]);

  // Seed demo data only on a completely fresh database.
  if (userCount === 0 && feedbackCount === 0) {
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

// ---------- Feedback ----------

export async function saveFeedback(
  feedback: Omit<FeedbackEntry, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<FeedbackEntry> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  if (feedback.submissionId) {
    const existingBySub = await col.findOne({ submissionId: feedback.submissionId });
    if (existingBySub) return stripId(existingBySub) as FeedbackEntry;
  }

  const duplicate = await col.findOne({
    studentEmail: feedback.studentEmail,
    tableId: feedback.tableId,
  });
  if (duplicate) {
    if (feedback.submissionId && (duplicate as { submissionId?: string }).submissionId === feedback.submissionId) {
      return stripId(duplicate) as FeedbackEntry;
    }
    throw new DuplicateFeedbackError();
  }

  const doc = { ...feedback, createdAt: feedback.createdAt ?? new Date() };
  try {
    await col.insertOne(doc as object & { _id?: never });
  } catch (err) {
    // Duplicate key from a concurrent submit racing the findOne above.
    if ((err as { code?: number }).code === 11000) {
      if (feedback.submissionId) {
        const found = await col.findOne({ submissionId: feedback.submissionId });
        if (found) return stripId(found) as FeedbackEntry;
      }
      throw new DuplicateFeedbackError();
    }
    throw err;
  }
  return doc as FeedbackEntry;
}

export async function getFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
} = {}): Promise<FeedbackEntry[]> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const query: Record<string, string> = {};
  if (filters.email) query.studentEmail = filters.email;
  if (filters.productId) query.tableId = filters.productId;
  if (filters.department) query.studentDepartment = filters.department;

  const docs = await col
    .find(query)
    .sort({ timestamp: -1 })
    .toArray();

  return docs.map((d) => stripId(d)) as FeedbackEntry[];
}

export async function getPaginatedFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
  limit?: number;
  cursor?: string;
  page?: number;
} = {}): Promise<PaginatedFeedbackResult> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const query: Record<string, unknown> = {};
  if (filters.email) query.studentEmail = filters.email;
  if (filters.productId) query.tableId = filters.productId;
  if (filters.department) query.studentDepartment = filters.department;
  if (filters.cursor) {
    query.timestamp = { $lt: filters.cursor };
  }

  const limit = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 25;
  const skip = filters.page && filters.page > 1 ? (filters.page - 1) * limit : 0;
  const docs = await col
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit + 1)
    .toArray();

  const hasMore = docs.length > limit;
  const sliced = hasMore ? docs.slice(0, limit) : docs;
  const items = sliced.map((d) => stripId(d)) as FeedbackEntry[];
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].timestamp) : null;

  return { items, nextCursor, hasMore };
}

export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const pipeline = await col
    .aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          uniqueEmails: { $addToSet: '$studentEmail' },
          avgRating: { $avg: '$rating' },
        },
      },
    ])
    .toArray();

  const agg = pipeline[0];
  return {
    totalUsers: agg ? (agg.uniqueEmails as string[]).length : 0,
    totalFeedback: agg ? agg.totalFeedback : 0,
    averageRating: Number((agg?.avgRating ?? 0).toFixed(2)),
  };
}

// ---------- Users / expedition progress ----------

export async function updateUserProgress(
  email: string,
  productId: string,
  info?: { name?: string; department?: string }
): Promise<ExpeditionUser> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);

  const user = (await col.findOne({ email })) as UserDoc | null;

  if (!user) {
    const fresh: UserDoc = {
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
    await col.insertOne(fresh as object & { _id?: never });
    return stripId(fresh);
  }

  if (info?.name && !user.name) user.name = info.name;
  if (info?.department && !user.department) user.department = info.department;
  if (!user.completedProducts.includes(productId)) {
    user.completedProducts.push(productId);
  }

  // Re-evaluate per-lab completion + shards + unlocks (same rules as the
  // in-memory store).
  for (const lab of LABS) {
    if (user.completedLabs.includes(lab.labId)) continue;
    const allDone = lab.products.every((p) => user!.completedProducts.includes(p.id));
    if (allDone) {
      user.completedLabs.push(lab.labId);
      if (!user.shards.includes(lab.labId)) user.shards.push(lab.labId);
      const idx = LAB_ORDER.indexOf(lab.labId);
      const next = LAB_ORDER[idx + 1];
      if (next && !user.unlockedLabs.includes(next)) user.unlockedLabs.push(next);
    }
  }

  if (user.shards.length >= LAB_ORDER.length && !user.completionDate) {
    user.completionDate = new Date().toISOString();
  }

  const { _id, ...doc } = user;
  await col.updateOne({ email }, { $set: doc });
  return stripId(user);
}

export async function getAllUsers(): Promise<Array<ExpeditionUser>> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);
  const docs = await col.find({}).toArray();
  return docs.map((d) => stripId(d)) as Array<ExpeditionUser>;
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);
  const docs = await col.find({}).toArray();
  return docs.map((d) => stripId(d)) as FeedbackEntry[];
}

export async function getLeaderboardAggregated(limit?: number): Promise<LeaderboardEntry[]> {
  const { col, db } = await collection(USERS_COLLECTION);
  await ensureSetup(db);

  const pipeline: object[] = [
    {
      $lookup: {
        from: FEEDBACK_COLLECTION,
        localField: 'email',
        foreignField: 'studentEmail',
        as: 'feedbacks',
      },
    },
    {
      $addFields: {
        totalRating: { $sum: '$feedbacks.rating' },
        feedbackCount: { $size: '$feedbacks' },
        completedProductsCount: { $size: { $ifNull: ['$completedProducts', []] } },
        isCompleted: {
          $gte: [{ $size: { $ifNull: ['$shards', []] } }, LAB_ORDER.length],
        },
      },
    },
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: ['$feedbackCount', 0] },
            { $divide: ['$totalRating', '$feedbackCount'] },
            0,
          ],
        },
      },
    },
    {
      $sort: {
        isCompleted: -1,
        completedProductsCount: -1,
        averageRating: -1,
      },
    },
    {
      $project: {
        _id: 0,
        feedbacks: 0,
        feedbackCount: 0,
        completedProductsCount: 0,
      },
    },
  ];

  if (typeof limit === 'number' && limit > 0) {
    pipeline.push({ $limit: limit });
  }

  const docs = await col.aggregate(pipeline).toArray();
  return docs as unknown as LeaderboardEntry[];
}

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
  const { col, db } = await collection(FEEDBACK_COLLECTION);
  await ensureSetup(db);

  const pipeline: object[] = [
    {
      $group: {
        _id: '$tableId',
        totalRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        totalComments: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$comment', null] },
                  { $ne: ['$comment', ''] },
                ],
              },
              1,
              0,
            ],
          },
        },
        lastRated: { $max: '$timestamp' },
      },
    },
  ];

  const docs = await col.aggregate(pipeline).toArray();
  return docs.map((d) => ({
    productId: d._id as string,
    totalRatings: d.totalRatings as number,
    averageRating: Number(((d.avgRating as number) || 0).toFixed(2)),
    ratingDistribution: {
      1: d.rating1 as number,
      2: d.rating2 as number,
      3: d.rating3 as number,
      4: d.rating4 as number,
      5: d.rating5 as number,
    },
    totalComments: d.totalComments as number,
    lastRated: d.lastRated ? String(d.lastRated) : null,
  }));
}

function stripId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}
