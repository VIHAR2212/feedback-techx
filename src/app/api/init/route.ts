import { NextResponse } from 'next/server';
import { initializeLabs, initializeAdmin } from '@/lib/services';

// POST /api/init — seeds mock store with the static labs + default admin.
// In the mock implementation this is effectively a no-op (the mock store
// self-seeds on first import), but the endpoint is preserved so seniors
// wiring up a real DB can use the same call.
export async function POST() {
  try {
    await initializeLabs();
    await initializeAdmin();
    return NextResponse.json({
      message: 'Mock store ready (labs static, admin seeded).',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initializing mock store:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize mock store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
