import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const { status, adminNote } = await request.json();

  const report = await prisma.report.update({
    where: { id: params.id },
    data: { status, adminNote },
  });

  return NextResponse.json(report);
}
