#!/usr/bin/env node
/**
 * One-time database setup for the TechX Expedition event.
 *
 *   npm run db:setup
 *
 * Run this ONCE against the production Atlas cluster before the event, and
 * again any time you restore/clear data. It is idempotent — running it
 * twice is harmless.
 *
 * What it does:
 *   1. Creates every index the app relies on. Building indexes on a live,
 *      already-populated collection stalls writes on a shared-CPU M0, which
 *      is exactly what you do not want at 10:00 on event day.
 *   2. Backfills the denormalized counters (users.feedbackCount /
 *      ratingSum / rankScore, the productStats rows, the eventStats
 *      document) from whatever feedback already exists. Safe to re-run to
 *      repair counters if they ever drift.
 *
 * Flags:
 *   --reset-counters   recompute counters from scratch (default behaviour)
 *   --drop-demo        delete the seeded demo explorers/feedback
 */

import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Minimal .env loader so the script works with plain `node` on any version.
for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = (match[2] ?? '').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'feedback-portal';
const DROP_DEMO = process.argv.includes('--drop-demo');

if (!URI) {
  console.error('MONGODB_URI is not set. Put it in .env.local or export it.');
  process.exit(1);
}

// Keep this in sync with src/lib/mock-data.ts (LAB_ORDER).
const LAB_ORDER = ['a', 'c', 'd'];
const DEMO_EMAILS = [
  'drake@uncharted.com',
  'elena@press.org',
  'sully@treasure.net',
  'chloe@frazer.co',
  'sam@drake.io',
];

function computeRankScore({ isCompleted, completedCount, averageRating }) {
  const avg = Math.round(Math.max(0, Math.min(5, averageRating)) * 100);
  return (isCompleted ? 1_000_000_000 : 0) + completedCount * 10_000 + avg;
}

const client = new MongoClient(URI, { maxPoolSize: 5 });

try {
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to "${DB_NAME}".\n`);

  const feedback = db.collection('feedback');
  const users = db.collection('users');
  const productStats = db.collection('productStats');
  const eventStats = db.collection('eventStats');

  if (DROP_DEMO) {
    const f = await feedback.deleteMany({ studentEmail: { $in: DEMO_EMAILS } });
    const u = await users.deleteMany({ email: { $in: DEMO_EMAILS } });
    console.log(`Dropped demo data: ${u.deletedCount} users, ${f.deletedCount} feedback rows.\n`);
  }

  // ---- 1. Indexes --------------------------------------------------------
  console.log('Creating indexes...');
  await feedback.createIndexes([
    // Guarantees one rating per explorer per product. This unique index is
    // the ONLY duplicate protection — the write path inserts optimistically
    // and lets a 11000 error signal the duplicate, so it must exist.
    { key: { studentEmail: 1, tableId: 1 }, name: 'uniq_email_table', unique: true },
    // Idempotency for retried / offline-queued submissions.
    { key: { submissionId: 1 }, name: 'uniq_submission', unique: true, sparse: true },
    // Admin ledger default sort + keyset pagination cursor.
    { key: { timestamp: -1 }, name: 'ts_desc' },
    // Filtered ledger views. Compound with timestamp so the filter and the
    // sort are both served by one index (no in-memory sort, which Mongo
    // aborts past 32 MB).
    { key: { tableId: 1, timestamp: -1 }, name: 'table_ts' },
    { key: { studentDepartment: 1, timestamp: -1 }, name: 'dept_ts' },
  ]);
  await users.createIndexes([
    { key: { email: 1 }, name: 'uniq_email', unique: true },
    // The leaderboard's entire query plan: sort by score, tie-break by time,
    // read the top N. No collection scan at any event size.
    { key: { rankScore: -1, updatedAt: 1 }, name: 'rank' },
  ]);
  console.log('  indexes ready.\n');

  // ---- 2. Backfill counters ---------------------------------------------
  console.log('Rebuilding counters from the feedback ledger...');

  // Per-explorer totals.
  const perUser = await feedback
    .aggregate([
      {
        $group: {
          _id: '$studentEmail',
          feedbackCount: { $sum: 1 },
          ratingSum: { $sum: '$rating' },
          products: { $addToSet: '$tableId' },
          name: { $first: '$studentName' },
          department: { $first: '$studentDepartment' },
          lastAt: { $max: '$timestamp' },
        },
      },
    ])
    .toArray();

  let userOps = [];
  for (const row of perUser) {
    const completedProducts = row.products.filter(Boolean);
    const completedCount = completedProducts.length;
    const averageRating = row.feedbackCount > 0 ? row.ratingSum / row.feedbackCount : 0;

    // Recompute shards/unlocks from the product catalogue in the database
    // is not possible here (the catalogue is static in code), so preserve
    // whatever the app already recorded and only fix the numeric counters.
    const existing = await users.findOne({ email: row._id }, { projection: { shards: 1 } });
    const isCompleted = (existing?.shards?.length ?? 0) >= LAB_ORDER.length;

    userOps.push({
      updateOne: {
        filter: { email: row._id },
        update: {
          $set: {
            feedbackCount: row.feedbackCount,
            ratingSum: row.ratingSum,
            completedCount,
            isCompleted,
            rankScore: computeRankScore({ isCompleted, completedCount, averageRating }),
            updatedAt: row.lastAt ? new Date(row.lastAt) : new Date(),
          },
          $setOnInsert: {
            email: row._id,
            name: row.name ?? '',
            department: row.department ?? '',
            completedProducts,
            unlockedLabs: [LAB_ORDER[0]],
            completedLabs: [],
            shards: [],
            discoveredClues: [],
            discoveredTreasures: [],
          },
        },
        upsert: true,
      },
    });

    if (userOps.length >= 500) {
      await users.bulkWrite(userOps, { ordered: false });
      userOps = [];
    }
  }
  if (userOps.length) await users.bulkWrite(userOps, { ordered: false });
  console.log(`  users: ${perUser.length} explorer counters rebuilt.`);

  // Explorers with no feedback yet still need a sortable score.
  await users.updateMany(
    { rankScore: { $exists: false } },
    { $set: { rankScore: 0, feedbackCount: 0, ratingSum: 0, completedCount: 0, isCompleted: false } }
  );

  // Per-product totals.
  const perProduct = await feedback
    .aggregate([
      {
        $group: {
          _id: '$tableId',
          labId: { $first: '$labId' },
          totalRatings: { $sum: 1 },
          ratingSum: { $sum: '$rating' },
          r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          totalComments: {
            $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$comment', ''] } }, 0] }, 1, 0] },
          },
          lastRated: { $max: '$timestamp' },
        },
      },
    ])
    .toArray();

  if (perProduct.length) {
    await productStats.bulkWrite(
      perProduct.map((p) => ({
        replaceOne: {
          filter: { _id: p._id },
          replacement: {
            labId: p.labId ?? null,
            totalRatings: p.totalRatings,
            ratingSum: p.ratingSum,
            r1: p.r1,
            r2: p.r2,
            r3: p.r3,
            r4: p.r4,
            r5: p.r5,
            totalComments: p.totalComments,
            lastRated: p.lastRated ? new Date(p.lastRated) : null,
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }
  console.log(`  productStats: ${perProduct.length} products.`);

  // Event-wide totals.
  const totalFeedback = perProduct.reduce((s, p) => s + p.totalRatings, 0);
  const ratingSum = perProduct.reduce((s, p) => s + p.ratingSum, 0);
  await eventStats.replaceOne(
    { _id: 'global' },
    { totalFeedback, ratingSum, totalUsers: perUser.length },
    { upsert: true }
  );
  console.log(`  eventStats: ${totalFeedback} submissions, ${perUser.length} explorers.\n`);

  const avg = totalFeedback ? (ratingSum / totalFeedback).toFixed(2) : '0.00';
  console.log(`Done. Average rating across the event: ${avg}`);
  console.log('\nSet AUTO_DB_SETUP=false in production so lambdas skip index');
  console.log('creation on every cold start.');
} catch (err) {
  console.error('\nSetup failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
