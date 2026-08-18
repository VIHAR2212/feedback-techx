import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

// GET /api/admin/leaderboard — returns ranked users (with shards,
// completionDate, isCompleted) for both public rankings and admin pages.
export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
