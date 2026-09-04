import { createHash, createHmac, timingSafeEqual } from 'crypto';

// Server-side admin auth helpers.
//
// Sessions are stateless: an HMAC-signed token stored in an HTTP-only
// cookie. The secret and credentials come from environment variables so
// nothing sensitive ships in the client bundle.

export const ADMIN_SESSION_COOKIE = 'admin_session';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    'techx-uncharted-expedition-super-secure-session-key-2026'
  );
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createSessionToken(username: string): string {
  const payload = Buffer.from(`${username}:${Date.now()}`).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): boolean {
  const secret = getSecret();
  if (!token || !secret || !token.includes('.')) return false;

  const dot = token.lastIndexOf('.');
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const separator = decoded.indexOf(':');
  if (separator < 0) return false;

  const issuedAt = Number(decoded.slice(separator + 1));
  return (
    Number.isFinite(issuedAt) &&
    issuedAt <= Date.now() &&
    Date.now() - issuedAt < SESSION_TTL_MS
  );
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername =
    process.env.ADMIN_USERNAME ||
    process.env.USERNAME ||
    'vcet-nsdc';
  const expectedPassword =
    process.env.ADMIN_PASSWORD ||
    process.env.Password ||
    process.env.PASSWORD ||
    'AIDS@2026';
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  const usernameOk = safeEqual(username.trim(), expectedUsername.trim());
  const passwordOk = expectedPasswordHash
    ? safeEqual(sha256(password), expectedPasswordHash.toLowerCase())
    : safeEqual(password, expectedPassword);

  // Compare both sides even on failure to keep timing uniform.
  return usernameOk && passwordOk;
}

// Read + validate the session cookie straight off a standard Request
// (works in route handlers; proxy.ts uses it via request.cookies too).
export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === ADMIN_SESSION_COOKIE) {
      try {
        return verifySessionToken(decodeURIComponent(rest.join('=')));
      } catch {
        return false;
      }
    }
  }
  return false;
}
