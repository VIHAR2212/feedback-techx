import { NextResponse } from 'next/server';
import { getPaginatedFeedback } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/feedback — the observation ledger, always paginated.
//
// The old unpaginated branch (no limit/cursor query params) returned every
// feedback row in the database. That is fine against seed data and fatal
// against a live event: hundreds of thousands of documents streamed into a
// lambda. Pagination is now mandatory, and it is keyset-based — `skip` made
// Mongo walk and discard every document before the requested page.
//
// CSV export should walk the cursor (follow `nextCursor` until `hasMore` is
// false) rather than asking for everything at once.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 25;

    const paginated = await getPaginatedFeedback({
      email: searchParams.get('email') || undefined,
      productId: searchParams.get('productId') || undefined,
      department: searchParams.get('department') || undefined,
      limit,
      cursor: searchParams.get('cursor') || undefined,
    });

    return NextResponse.json(paginated, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
