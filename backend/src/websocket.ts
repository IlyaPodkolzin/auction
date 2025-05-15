import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initializeWebSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinLot', async (lotId: string) => {
      socket.join(`lot-${lotId}`);
    });

    socket.on('leaveLot', (lotId: string) => {
      socket.leave(`lot-${lotId}`);
    });

    socket.on('placeBid', async (data: { lotId: string; amount: number; userId: string }) => {
      try {
        const { lotId, amount, userId } = data;

        // Проверяем, что лот существует и активен
        const lot = await prisma.lot.findUnique({
          where: { id: lotId },
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        if (!lot || lot.status !== 'ACTIVE') {
          socket.emit('error', 'Лот не найден или неактивен');
          return;
        }

        // Проверяем, что ставка выше текущей цены
        const currentPrice = lot.bids[0]?.amount || lot.startPrice;
        if (amount <= currentPrice) {
          socket.emit('error', 'Ставка должна быть выше текущей цены');
          return;
        }

        // Создаем новую ставку
        const bid = await prisma.bid.create({
          data: {
            amount,
            lotId,
            userId
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        });

        // Обновляем текущую цену лота
        await prisma.lot.update({
          where: { id: lotId },
          data: { currentPrice: amount }
        });

        // Отправляем обновление всем участникам аукциона
        io.to(`lot-${lotId}`).emit('newBid', {
          bid,
          currentPrice: amount
        });
      } catch (error) {
        socket.emit('error', 'Ошибка при размещении ставки');
      }
    });

    socket.on('disconnect', () => {
      // Очистка при отключении
    });
  });

  return io;
}; 