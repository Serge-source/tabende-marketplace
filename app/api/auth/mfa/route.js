import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// GET — generate a new MFA secret + QR code (setup step 1)
export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const secret = speakeasy.generateSecret({
    name: `Tabende (${user.email})`,
    issuer: 'Tabende',
    length: 20,
  });

  // Store the temp secret (not enabled yet — enabled only after verification)
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: secret.base32 },
  });

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  return NextResponse.json({ secret: secret.base32, qr: qrDataUrl });
}

// POST — verify token and enable MFA
export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.mfaSecret) return NextResponse.json({ error: 'Run setup first' }, { status: 400 });

  const valid = speakeasy.totp.verify({
    secret: dbUser.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
  return NextResponse.json({ ok: true });
}

// DELETE — disable MFA (requires current TOTP token)
export async function DELETE(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.mfaEnabled) return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });

  const valid = speakeasy.totp.verify({
    secret: dbUser.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: false, mfaSecret: null } });
  return NextResponse.json({ ok: true });
}
