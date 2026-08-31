import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';

// Lightweight session probe used by the client AdminContext on mount.
// The proxy already blocks this route without a valid cookie, so reaching
// the handler means authenticated — but we still verify explicitly so the
// route stays correct even if the matcher changes.
export async function GET(request: Request) {
  if (isAdminRequest(request)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
