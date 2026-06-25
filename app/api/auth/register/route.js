import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setTokenCookie } from '@/lib/auth';
import { registerSchema, validate } from '@/lib/validations';
import { sendWelcomeEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again in 1 hour.' }, { status: 429 });
    }

    const body = await request.json();
    const { error, data } = validate(registerSchema, body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const { name, email, password, role } = data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(console.error);

    const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token,
    }, { status: 201 });
    setTokenCookie(res, token);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
