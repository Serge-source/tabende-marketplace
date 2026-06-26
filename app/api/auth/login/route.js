import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setTokenCookie } from '@/lib/auth';
import { loginSchema, validate } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import speakeasy from 'speakeasy';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, remaining } = rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      });
    }

    const body = await request.json();
    const { error, data } = validate(loginSchema, body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const { email, password, mfaToken } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // If MFA is enabled, require TOTP token
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 });
      }
      const valid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 1,
      });
      if (!valid) return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token,
    });
    setTokenCookie(res, token);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
