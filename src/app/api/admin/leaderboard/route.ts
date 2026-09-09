import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/leaderboard — full ranked-user records including PII
// (emails, per-product progress). Authenticated admins only: access is
// enforced server-side by src/proxy.ts.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseInt(searchParams.get('limit') ?? '', 10);
    // Previously unbounded — on a 20k-explorer event that serialised every
    // record, arrays included, into a single response on every poll.
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 100;

    const leaderboard = await getLeaderboard(limit);
    return NextResponse.json(leaderboard, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
