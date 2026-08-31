import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  verifyAdminCredentials,
} from '@/lib/admin-auth';

// Best-effort per-instance brute-force throttle: max 10 failed attempts
// per IP per 15-minute window.
const attempts = new Map<string, { count: number; windowStart: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function isThrottled(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: Date.now() });
  } else {
    entry.count++;
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (isThrottled(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password || !verifyAdminCredentials(username, password)) {
    recordFailure(ip);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  attempts.delete(ip);

  // Mark the cookie Secure only when the request actually arrived over
  // HTTPS so plain-HTTP LAN deployments don't get silently logged out.
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps =
    forwardedProto !== null
      ? forwardedProto.split(',')[0].trim() === 'https'
      : new URL(request.url).protocol === 'https:';

  const response = NextResponse.json({ ok: true, username });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createSessionToken(username),
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return response;
}
