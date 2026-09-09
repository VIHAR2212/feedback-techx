import { NextResponse } from 'next/server';
import { submitFeedback, DuplicateFeedbackError } from '@/lib/services';
import { getProductById } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A cold lambda plus a cold M0 connection can take a few seconds; 10s (the
// platform default) is uncomfortably tight when the cluster is busy.
export const maxDuration = 20;

// Comments are the only unbounded field, and storage is the binding limit
// on Atlas M0 (512 MB). At ~20k explorers this ceiling keeps the whole
// ledger — documents plus indexes — inside roughly 150 MB.
const MAX_COMMENT_CHARS = 400;

function asString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// Best-effort per-explorer throttle, scoped to one lambda instance.
//
// Deliberately keyed by email and NOT by IP: at a campus event thousands of
// phones share a handful of NAT addresses, so an IP limiter would lock out
// entire lecture halls. Genuine duplicate ratings are already impossible —
// the unique index on (studentEmail, tableId) rejects them in a single
// round trip — so this only exists to blunt a runaway client retry loop.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const globalWithLimiter = globalThis as typeof globalThis & {
  __feedbackRate?: Map<string, { count: number; resetAt: number }>;
};
const rateBuckets =
  globalWithLimiter.__feedbackRate ?? (globalWithLimiter.__feedbackRate = new Map());

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Opportunistic sweep so the map cannot grow without bound across a
    // long-lived warm instance.
    if (rateBuckets.size > 5000) {
      for (const [k, v] of rateBuckets) if (v.resetAt <= now) rateBuckets.delete(k);
    }
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

// POST /api/feedback — submit one discovery (feedback entry).
// Server-side validation: the product must exist, rating must be 1–5,
// timestamps are always generated server-side (client values ignored).
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const tableId = asString(body?.tableId, 64);
    const product = tableId ? getProductById(tableId) : undefined;
    if (!product) {
      return NextResponse.json({ message: 'Unknown product id.' }, { status: 400 });
    }

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    const studentEmail = asString(body?.studentEmail, 120);
    if (!studentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return NextResponse.json(
        { message: 'A valid student email is required.' },
        { status: 400 }
      );
    }

    if (isRateLimited(studentEmail)) {
      return NextResponse.json(
        { message: 'Too many submissions. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const submissionId = asString(body?.submissionId, 64) || undefined;

    const { entry, created } = await submitFeedback({
      submissionId,
      studentName: asString(body?.studentName, 80) || 'Anonymous Explorer',
      studentEmail,
      studentDepartment: asString(body?.studentDepartment, 80),
      labId: product.lab.labId,
      tableId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment: asString(body?.comment, MAX_COMMENT_CHARS),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: created
          ? 'Discovery logged successfully'
          : 'Discovery already logged (replayed submission).',
        id: entry._id,
        created,
      },
      { status: created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof DuplicateFeedbackError) {
      return NextResponse.json(
        { message: 'You already logged a discovery for this product.' },
        { status: 409 }
      );
    }
    console.error('API Route Error:', error);
    return NextResponse.json({ message: 'Error submitting discovery.' }, { status: 500 });
  }
}
