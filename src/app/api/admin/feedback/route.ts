import { NextResponse } from 'next/server';
import { getFeedback } from '@/lib/services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const productId = searchParams.get('productId');
    const department = searchParams.get('department');
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
