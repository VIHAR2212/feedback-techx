// MongoDB-backed implementation of the feedback/user services.
// Same shapes as the in-memory fallback: `feedback` and `users` collections
// mirror FeedbackEntry / ExpeditionUser. Seeded once from seed-data when
// both collections are empty.

import { Db } from 'mongodb';
import { getDatabase } from './mongodb';
import { DuplicateFeedbackError } from './errors';
import { FeedbackEntry, ExpeditionUser } from './models';
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

  const duplicate = await col.findOne({
    studentEmail: feedback.studentEmail,
    tableId: feedback.tableId,
  });
  if (duplicate) throw new DuplicateFeedbackError();

  const doc = { ...feedback, createdAt: feedback.createdAt ?? new Date() };
  try {
    await col.insertOne(doc as object & { _id?: never });
  } catch (err) {
    // Duplicate key from a concurrent submit racing the findOne above.
    if ((err as { code?: number }).code === 11000) {
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

function stripId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}
