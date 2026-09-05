import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

// GET /api/admin/leaderboard — full ranked-user records including PII
// (emails, per-product progress). Authenticated admins only: access is
// enforced server-side by src/proxy.ts.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : undefined;
    const leaderboard = await getLeaderboard(limit);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
