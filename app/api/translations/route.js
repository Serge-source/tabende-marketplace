import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { isValidLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// GET /api/translations?locale=pap — public: admin overrides for a locale
// (the base dictionaries ship with the client; overrides layer on top)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale');
  if (!locale || !isValidLocale(locale)) {
    return NextResponse.json({ error: 'Valid locale required (en, nl, es, pap)' }, { status: 400 });
  }
  const rows = await prisma.translation.findMany({ where: { locale } });
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({ locale, overrides });
}

// PUT /api/translations — admin: upsert an override { locale, key, value }
export async function PUT(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const { locale, key, value } = await request.json();
  if (!isValidLocale(locale)) return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  if (!key?.trim() || typeof value !== 'string' || !value.trim()) {
    return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
  }

  const row = await prisma.translation.upsert({
    where: { locale_key: { locale, key: key.trim() } },
    create: { locale, key: key.trim(), value },
    update: { value },
  });
  return NextResponse.json(row);
}

// DELETE /api/translations — admin: remove an override { locale, key }
export async function DELETE(request) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const { locale, key } = await request.json();
  await prisma.translation.deleteMany({ where: { locale, key } });
  return NextResponse.json({ ok: true });
}
