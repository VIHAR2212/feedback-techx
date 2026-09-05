import { NextResponse } from 'next/server';
import { getAdminDashboardData } from '@/lib/services';

// GET /api/admin/dashboard — combined administrative overview endpoint.
// Returns core metrics, recent feedback slice, top explorers, and product stats in a single payload
// to minimize mobile RTT on slow/high-latency networks.
export async function GET() {
  try {
    const data = await getAdminDashboardData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
