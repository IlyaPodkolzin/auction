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

        // Send notification to seller
        await prisma.notification.create({
          data: {
            userId: lot.sellerId,
            type: 'LOT_SOLD',
            message: `Your lot "${lot.title}" has been sold for $${highestBid.amount}`,
            lotId: lot.id
          }
        });

        // Send notification to highest bidder
        await prisma.notification.create({
          data: {
            userId: highestBid.userId,
            type: 'BID_WON',
            message: `You won the auction for "${lot.title}" with a bid of $${highestBid.amount}`,
            lotId: lot.id
          }
        });
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