import { NextResponse } from 'next/server';
import { getProductStats } from '@/lib/services';

export const runtime = 'nodejs';
// Without this, Next would try to evaluate this handler at build time and
// bake the (empty) build-time product stats into a static response.
export const dynamic = 'force-dynamic';

// GET /api/product-stats — per-product rating distribution. Aggregates
// only; no PII. Polled alongside the leaderboard by both the public and
// admin boards, so it gets the same edge-cache treatment.
//
// Product totals move much more slowly than rankings and nothing on screen
// animates off them, so a 10s window halves the origin traffic again.
const CACHE_SECONDS = 10;

export async function GET() {
  try {
    const stats = await getProductStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return NextResponse.json({ error: 'Failed to fetch product statistics' }, { status: 500 });
  }
}
