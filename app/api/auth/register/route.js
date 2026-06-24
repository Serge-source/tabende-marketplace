import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role === 'SELLER' ? 'SELLER' : 'BUYER' },
    });

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
