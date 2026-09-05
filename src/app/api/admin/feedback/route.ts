import { NextResponse } from 'next/server';
import { getFeedback, getPaginatedFeedback } from '@/lib/services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const productId = searchParams.get('productId');
    const department = searchParams.get('department');
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') || undefined;
    const pageParam = searchParams.get('page');

    if (limitParam || cursor || pageParam) {
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || '25', 10) || 25));
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;
      const paginated = await getPaginatedFeedback({
        email: userEmail || undefined,
        productId: productId || undefined,
        department: department || undefined,
        limit,
        cursor,
        page,
      });
      return NextResponse.json(paginated);
    }

    const filters = {
      email: userEmail || undefined,
      productId: productId || undefined,
      department: department || undefined,
    };
    const feedback = await getFeedback(filters);
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
