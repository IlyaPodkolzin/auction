import { Server, Socket } from 'socket.io';
import { prisma } from './index';

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join lot room
    socket.on('joinLot', (lotId: string) => {
      socket.join(`lot-${lotId}`);
    });

    // Leave lot room
    socket.on('leaveLot', (lotId: string) => {
      socket.leave(`lot-${lotId}`);
    });

    // Handle new bid
    socket.on('placeBid', async ({ lotId, userId, amount }) => {
      try {
        const lot = await prisma.lot.findUnique({
          where: { id: lotId },
          include: { bids: true }
        });

        if (!lot) {
          socket.emit('error', 'Lot not found');
          return;
        }

        if (lot.status !== 'ACTIVE') {
          socket.emit('error', 'Lot is not active');
          return;
        }

        if (amount <= lot.currentPrice) {
          socket.emit('error', 'Bid must be higher than current price');
          return;
        }

        const bid = await prisma.bid.create({
          data: {
            amount,
            lotId,
            userId
          }
        });

        await prisma.lot.update({
          where: { id: lotId },
          data: { currentPrice: amount }
        });

        // Broadcast new bid to all clients in the lot room
        io.to(`lot-${lotId}`).emit('newBid', {
          bid,
          currentPrice: amount
        });
      } catch (error) {
        console.error('Error placing bid:', error);
        socket.emit('error', 'Failed to place bid');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}; 