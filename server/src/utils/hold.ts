import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cleanupExpiredHolds = async (): Promise<void> => {
  const now = new Date();
  
  // Find all HELD appointments where holdExpiresAt has passed
  const expiredHolds = await prisma.appointment.updateMany({
    where: {
      status: 'HELD',
      holdExpiresAt: {
        lt: now
      }
    },
    data: {
      status: 'CANCELLED'
    }
  });

  if (expiredHolds.count > 0) {
    console.log(`[Hold Cleanup] Released ${expiredHolds.count} expired slot holds.`);
  }
};
