import { NextResponse } from 'next/server';
import { rollForTreasure } from '@/lib/services';

// POST /api/expedition/treasure
// Always returns { treasure: {...} } — one entry in the pool is an
// "Empty Cache" dud so the result feels fair without ever blocking
// expedition progress.
export async function POST() {
  try {
    const result = await rollForTreasure();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error rolling for treasure:', error);
    return NextResponse.json(
      { treasure: { id: 'tr-blank', name: 'Empty Cache', description: 'Something went wrong — try again later.' } },
      { status: 200 }
    );
  }
}
