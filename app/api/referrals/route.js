import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — my referral code (created lazily), link, credit balance, and stats
export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { referralCode: true, creditBalance: true },
  });

  if (!me.referralCode) {
    // short, url-safe, retried on the (unlikely) collision
    for (let i = 0; i < 3; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      try {
        me = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: code },
          select: { referralCode: true, creditBalance: true },
        });
        break;
      } catch {}
    }
  }

  const referredCount = await prisma.user.count({ where: { referredById: user.id } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tabende-marketplace-production.up.railway.app';

  return NextResponse.json({
    code: me.referralCode,
    link: `${appUrl}/register?ref=${me.referralCode}`,
    creditBalance: me.creditBalance,
    referredCount,
  });
}
