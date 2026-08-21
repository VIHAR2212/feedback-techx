import { NextResponse } from 'next/server';
import {
  getLabsFromDb,
  saveLabsToDb,
  resetLabsToSeed,
} from '@/lib/lab-service';
import { ExpeditionLab } from '@/lib/expeditionData';

// GET /api/admin/labs — current labs (auto-seeds from static config on first run)
export async function GET() {
  try {
    const labs = await getLabsFromDb();
    return NextResponse.json({ labs });
  } catch (err) {
    console.error('GET /api/admin/labs failed:', err);
    return NextResponse.json({ error: 'Failed to load labs' }, { status: 500 });
  }
}

// PUT /api/admin/labs — body: { labs: Record<labKey, ExpeditionLab> }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const labs = await saveLabsToDb((body?.labs ?? {}) as Record<string, ExpeditionLab>);
    return NextResponse.json({ labs });
  } catch (err) {
    console.error('PUT /api/admin/labs failed:', err);
    return NextResponse.json({ error: 'Failed to save labs' }, { status: 400 });
  }
}

// DELETE /api/admin/labs — reset labs to the seeded defaults
export async function DELETE() {
  try {
    const labs = await resetLabsToSeed();
    return NextResponse.json({ labs });
  } catch (err) {
    console.error('DELETE /api/admin/labs failed:', err);
    return NextResponse.json({ error: 'Failed to reset labs' }, { status: 500 });
  }
}