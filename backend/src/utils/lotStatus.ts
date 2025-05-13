import { Prisma } from '@prisma/client';

export const updateLotStatus = async (prisma: Prisma.TransactionClient, lotId: string): Promise<void> => {
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1
      }
    }
  });

  if (!lot) {
    throw new Error('Лот не найден');
  }

  const now = new Date();
  let newStatus = lot.status;

  if (now >= lot.endTime) {
    if (lot.bids.length > 0) {
      newStatus = 'COMPLETED';
      const winningBid = lot.bids[0];
      await prisma.lot.update({
        where: { id: lotId },
        data: {
          status: newStatus,
          currentPrice: winningBid.amount
        }
      });

      // Create notification for the winner
      await prisma.notification.create({
        data: {
          type: 'WIN',
          message: `Вы выиграли лот "${lot.title}"!`,
          userId: winningBid.userId,
          lotId: lotId
        }
      });

      // Create notification for the seller
      await prisma.notification.create({
        data: {
          type: 'SOLD',
          message: `Ваш лот "${lot.title}" продан!`,
          userId: lot.sellerId,
          lotId: lotId
        }
      });
    } else {
      newStatus = 'EXPIRED';
      await prisma.lot.update({
        where: { id: lotId },
        data: { status: newStatus }
      });

      // Create notification for the seller
      await prisma.notification.create({
        data: {
          type: 'EXPIRED',
          message: `Ваш лот "${lot.title}" истек без ставок.`,
          userId: lot.sellerId,
          lotId: lotId
        }
      });
    }
  } else if (lot.status === 'PENDING' && now >= lot.startTime) {
    newStatus = 'ACTIVE';
    await prisma.lot.update({
      where: { id: lotId },
      data: { status: newStatus }
    });
  }
}; 