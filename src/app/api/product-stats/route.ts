import { NextResponse } from 'next/server';
import { getProductStats } from '@/lib/services';

// GET /api/product-stats — per-product rating distribution. Aggregates
// only; no PII. Used by the public and admin leaderboard views. Reads
// through the services facade so it works on MongoDB (native aggregation)
// or the in-memory fallback alike.
export async function GET() {
  try {
    const stats = await getProductStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return NextResponse.json({ error: 'Failed to fetch product statistics' }, { status: 500 });
  }
}

