import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/leaderboard — public rankings. Display-safe fields only: no
// emails, no per-product progress detail.
//
// THIS IS THE HOT PATH. Every explorer's phone polls it every 5 seconds;
// at 20k attendees that is thousands of requests per second, which neither
// a Hobby-plan function nor an M0 cluster can serve directly.
//
// The response is therefore CDN-cached for exactly one poll interval. Vercel
// collapses every request arriving inside that window into a single origin
// invocation, so the load reaching MongoDB is ~0.2 req/s regardless of
// whether 200 or 20,000 people are watching. `stale-while-revalidate` keeps
// the board serving instantly while that one refresh runs in the background,
// so nobody ever waits on a database query.
const POLL_SECONDS = 5;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseInt(searchParams.get('limit') ?? '', 10);
    // Capped: an uncapped limit would serialise every explorer at the event
    // into one JSON payload, several megabytes wide, every 5 seconds.
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;

    const leaderboard = await getLeaderboard(limit);

    const publicLeaderboard = leaderboard.map((entry) => ({
      name: entry.name,
      department: entry.department,
      completedProductsCount: entry.completedProducts?.length ?? 0,
      shards: entry.shards ?? [],
      completionDate: entry.completionDate ?? null,
      totalRating: entry.totalRating,
      averageRating: entry.averageRating,
      isCompleted: entry.isCompleted,
    }));

    return NextResponse.json(publicLeaderboard, {
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${POLL_SECONDS}, stale-while-revalidate=30`,
        // Vercel honours CDN-Cache-Control ahead of Cache-Control, and this
        // keeps the browser from caching a copy of its own (max-age=0 above)
        // so each poll still reaches the edge and sees fresh data.
        'CDN-Cache-Control': `public, s-maxage=${POLL_SECONDS}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
