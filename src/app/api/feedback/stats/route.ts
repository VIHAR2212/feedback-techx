import { NextResponse } from 'next/server';
import { getFeedbackStats } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/feedback/stats — event-wide totals (explorers, submissions,
// average rating). Reads three counters, never scans the ledger.
const CACHE_SECONDS = 10;

export async function GET() {
  try {
    const stats = await getFeedbackStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
