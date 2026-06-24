import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { saveUploadedFile } from '@/lib/upload';

export async function PUT(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const formData = await request.formData();
  const data = {};
  if (formData.get('name')) data.name = formData.get('name');
  if (formData.get('bio') !== null) data.bio = formData.get('bio');
  const role = formData.get('role');
  if (role && ['BUYER', 'SELLER'].includes(role)) data.role = role;

  const avatarFile = formData.get('avatar');
  if (avatarFile instanceof File && avatarFile.size > 0) {
    data.avatar = await saveUploadedFile(avatarFile);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, isVerified: true },
  });
  return NextResponse.json(updated);
}
