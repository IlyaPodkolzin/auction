import { prisma } from '../index';

export const updateLotStatus = async (lotId: string) => {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: { bids: true }
    });

    if (!lot) return;

    const now = new Date();
    const startTime = new Date(lot.startTime);
    const endTime = new Date(lot.endTime);

    let newStatus = lot.status;

    // Check if lot should be ACTIVE
    if (lot.status === 'PENDING' && now >= startTime && now < endTime) {
      newStatus = 'ACTIVE';
    }
    // Check if lot should be SOLD or CANCELLED
    else if (now >= endTime) {
      newStatus = lot.bids.length > 0 ? 'SOLD' : 'CANCELLED';
    }

    if (newStatus !== lot.status) {
      const updatedLot = await prisma.lot.update({
        where: { id: lotId },
        data: { status: newStatus }
      });

      // If lot is sold, send notifications
      if (newStatus === 'SOLD' && lot.bids.length > 0) {
        const highestBid = lot.bids.reduce((prev, current) => 
          prev.amount > current.amount ? prev : current
        );

        // Get buyer and seller information
        const [buyer, seller] = await Promise.all([
          prisma.user.findUnique({
            where: { id: highestBid.userId },
            select: { name: true, email: true }
          }),
          prisma.user.findUnique({
            where: { id: lot.sellerId },
            select: { name: true, email: true }
          })
        ]);

        if (buyer && seller) {
          // Send notification to seller
          await prisma.notification.create({
            data: {
              userId: lot.sellerId,
              type: 'LOT_SOLD',
              message: `Ваш лот "${lot.title}" продан пользователю ${buyer.name} (${buyer.email}) за ${highestBid.amount}₽`,
              lotId: lot.id
            }
          });

          // Send notification to highest bidder
          await prisma.notification.create({
            data: {
              userId: highestBid.userId,
              type: 'BID_WON',
              message: `Вы выиграли аукцион "${lot.title}" за ${highestBid.amount}₽. Контактные данные продавца: ${seller.name} (${seller.email})`,
              lotId: lot.id
            }
          });
        }
      }
      // If lot is cancelled, notify seller
      else if (newStatus === 'CANCELLED') {
        await prisma.notification.create({
          data: {
            userId: lot.sellerId,
            type: 'LOT_CANCELLED',
            message: `Your lot "${lot.title}" has been cancelled as no bids were placed`,
            lotId: lot.id
          }
        });
      }

      return updatedLot;
    }

    return lot;
  } catch (error) {
    console.error('Error updating lot status:', error);
    throw error;
  }
}; 