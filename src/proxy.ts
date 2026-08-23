import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/admin-auth';

// Guards every /api/admin/* endpoint server-side. The login route stays
// public; everything else requires a valid signed session cookie.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  if (!verifySessionToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
