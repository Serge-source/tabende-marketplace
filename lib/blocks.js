import { prisma } from './prisma';

// True if either user has blocked the other
export async function isBlockedEitherWay(userA, userB) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });
  return !!block;
}
