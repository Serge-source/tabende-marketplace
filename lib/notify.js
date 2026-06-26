import { prisma } from './prisma';

export async function createNotification(userId, { type, title, body, href }) {
  try {
    await prisma.notification.create({ data: { userId, type, title, body, href } });
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message);
  }
}
