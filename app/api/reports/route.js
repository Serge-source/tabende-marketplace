import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { reportSchema, validate } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const { error: validError, data } = validate(reportSchema, body);
  if (validError) return NextResponse.json({ error: validError }, { status: 400 });

  const report = await prisma.report.create({
    data: {
      reason: data.reason,
      description: data.description,
      reporterId: user.id,
      listingId: data.listingId || null,
      reportedUserId: data.reportedUserId || null,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
