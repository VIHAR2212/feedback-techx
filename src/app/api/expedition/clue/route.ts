import { NextResponse } from 'next/server';
import { rollForClue } from '@/lib/services';

// POST /api/expedition/clue — body: { labId }
// Returns either { clue: {...} } or { clue: null }.
// Clues are optional and never block lab completion — the caller is free
// to ignore the result entirely.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { labId?: string };
    const labId = body.labId ?? 'a';
    const result = await rollForClue(labId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error rolling for clue:', error);
    // Fail soft — return "no clue" instead of a 500 so the happy path
    // doesn't break in the user's UI.
    return NextResponse.json({ clue: null });
  }
}
