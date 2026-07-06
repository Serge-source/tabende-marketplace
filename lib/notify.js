import { prisma } from './prisma';

export async function createNotification(userId, { type, title, body, href }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, href },
    });
    // Push in real time if the user has an open socket connection
    if (global._io) {
      global._io.to(`user:${userId}`).emit('notification', notification);
    }
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message);
  }
}
