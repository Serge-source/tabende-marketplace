import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);
const COOKIE = 'tab_token';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setTokenCookie(res, token) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    // ALLOW_INSECURE_COOKIES=1 lets CI e2e tests run the production build
    // over plain http://localhost; never set it on a real deployment
    secure: process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== '1',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours (renewed on activity via /api/auth/me)
    path: '/',
  });
}

export function clearTokenCookie(res) {
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' });
}

export async function requireAuth(request) {
  const token =
    request.cookies.get(COOKIE)?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const user = await verifyToken(token);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireRole(request, ...roles) {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };
  if (!roles.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}
