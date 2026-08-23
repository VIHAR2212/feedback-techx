import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

// GET /api/leaderboard — public rankings. Display-safe fields only: no
// emails, no per-product progress detail.
export async function GET() {
  try {
    const leaderboard = await getLeaderboard();

    const publicLeaderboard = leaderboard.map((entry) => ({
      name: entry.name,
      department: entry.department,
      completedProductsCount: entry.completedProducts.length,
      shards: entry.shards,
      completionDate: entry.completionDate ?? null,
      totalRating: entry.totalRating,
      averageRating: entry.averageRating,
      isCompleted: entry.isCompleted,
    }));

    return NextResponse.json(publicLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
