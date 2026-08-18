// ===========================================================================
// REFERENCE ONLY — Original MongoDB-backed services from the Minecraft project
// ===========================================================================
//
// This file is NOT imported by anything in the skeleton. It is preserved
// verbatim from the user's original `feedback-techx` codebase so seniors
// can swap the mock services in `./services.ts` for a real MongoDB backend
// without having to dig through git history.
//
// To switch the skeleton to MongoDB:
//   1. `bun add mongodb`
//   2. Add `MONGODB_URI` and `DB_NAME` to `.env.local`.
//   3. Restore `./mongodb.ts` from the original project.
//   4. Replace each function body in `./services.ts` with the matching
//      function below. Function signatures already match — no caller-side
//      changes are required.
//
// The original project stored per-user progress only as `completedFeedback`.
// For Uncharted we extended the User model in `prisma/schema.prisma` with
// `completedLabs`, `unlockedLabs`, `shards`, `discoveredClues`,
// `discoveredTreasures`. Mirror those fields in your Mongo `users`
// collection if you keep Mongo instead of Prisma.
// ===========================================================================

import { getDatabase } from './mongodb';
import { FeedbackEntry, User, Lab, Admin } from './models';

// Feedback operations
export async function saveFeedback(feedback: Omit<FeedbackEntry, '_id'>): Promise<FeedbackEntry> {
  const db = await getDatabase();
  const collection = db.collection<FeedbackEntry>('feedback');

  const feedbackWithTimestamp = {
    ...feedback,
    createdAt: new Date()
  };

  const result = await collection.insertOne(feedbackWithTimestamp);
  return { ...feedbackWithTimestamp, _id: result.insertedId.toString() };
}

export async function getFeedback(filters: {
  email?: string;
  productId?: string;
  department?: string;
} = {}): Promise<FeedbackEntry[]> {
  const db = await getDatabase();
  const collection = db.collection<FeedbackEntry>('feedback');

  const query: Record<string, string> = {};
  if (filters.email) query.studentEmail = filters.email;
  if (filters.productId) query.tableId = filters.productId;
  if (filters.department) query.studentDepartment = filters.department;

  const feedback = await collection.find(query).sort({ timestamp: -1 }).toArray();
  return feedback.map(f => ({ ...f, _id: f._id?.toString() }));
}

export async function getFeedbackStats(): Promise<{
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
}> {
  const db = await getDatabase();
  const collection = db.collection<FeedbackEntry>('feedback');

  const totalFeedback = await collection.countDocuments();
  const uniqueEmails = await collection.distinct('studentEmail');
  const totalUsers = uniqueEmails.length;

  const avgResult = await collection.aggregate([
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]).toArray();

  const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;

  return {
    totalUsers,
    totalFeedback,
    averageRating: Number(averageRating.toFixed(2))
  };
}

// User operations
export async function updateUserProgress(
  email: string,
  productId: string,
  info?: { name?: string; department?: string }
): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');

  const user = await collection.findOne({ email });

  if (!user) {
    const newUser: Omit<User, '_id'> = {
      name: info?.name ?? '',
      email,
      department: info?.department ?? '',
      completedFeedback: [productId],
      totalRating: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId.toString() };
  } else {
    const updatedFeedback = [...new Set([...user.completedFeedback, productId])];
    const isCompleted = updatedFeedback.length >= 25;

    const updateData: Partial<User> = {
      completedFeedback: updatedFeedback,
      updatedAt: new Date()
    };

    // Back-fill name / department from the feedback payload if missing.
    if (info?.name && !user.name) updateData.name = info.name;
    if (info?.department && !user.department) updateData.department = info.department;

    if (isCompleted && !user.completionDate) {
      updateData.completionDate = new Date();
    }

    await collection.updateOne({ email }, { $set: updateData });
    return { ...user, ...updateData, _id: user._id?.toString() };
  }
}

export async function getLeaderboard(): Promise<User[]> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');

  const users = await collection.find({}).toArray();

  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const feedback = await getFeedback({ email: user.email });
      const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = feedback.length > 0 ? totalRating / feedback.length : 0;

      return {
        ...user,
        _id: user._id?.toString(),
        totalRating,
        averageRating,
        isCompleted: user.completedFeedback.length >= 25
      };
    })
  );

  return usersWithStats.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return b.isCompleted ? 1 : -1;
    }
    if (a.completedFeedback.length !== b.completedFeedback.length) {
      return b.completedFeedback.length - a.completedFeedback.length;
    }
    return b.averageRating - a.averageRating;
  });
}

export async function getLabs(): Promise<Lab[]> {
  const db = await getDatabase();
  const collection = db.collection<Lab>('labs');
  const labs = await collection.find({}).toArray();
  return labs.map(lab => ({ ...lab, _id: lab._id?.toString() }));
}

export async function initializeLabs(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<Lab>('labs');
  const existingLabs = await collection.countDocuments();
  if (existingLabs > 0) return;
  // ...seed labs here (see ./mock-data.ts LABS for the Uncharted layout)
}

export async function getAdmin(username: string): Promise<Admin | null> {
  const db = await getDatabase();
  const collection = db.collection<Admin>('admins');
  const admin = await collection.findOne({ username });
  return admin ? { ...admin, _id: admin._id?.toString() } : null;
}

export async function initializeAdmin(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<Admin>('admins');
  const existingAdmin = await collection.countDocuments();
  if (existingAdmin > 0) return;
  const admin: Omit<Admin, '_id'> = {
    username: 'vcet-nsdc',
    password: 'AIDS@2025',
    permissions: ['leaderboard', 'feedback_view', 'analytics'],
    createdAt: new Date()
  };
  await collection.insertOne(admin);
}
