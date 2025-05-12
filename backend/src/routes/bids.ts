import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

// Get all bids for a lot
router.get('/lot/:lotId', async (req: Request, res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { lotId: req.params.lotId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ error: 'Не удалось получить ставки' });
  }
});

// Get user's bids
router.get('/user', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { userId: req.user!.userId },
      include: {
        lot: {
          select: {
            id: true,
            title: true,
            description: true,
            currentPrice: true,
            status: true,
            endTime: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить ставки пользователя' });
  }
});

// Create a new bid
router.post(
  '/',
  authenticateToken,
  [body('lotId').notEmpty(), body('amount').isFloat({ min: 0 })],
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { lotId, amount } = req.body;

      // Get lot
      const lot = await prisma.lot.findUnique({
        where: { id: lotId }
      });

      if (!lot) {
        return res.status(404).json({ error: 'Лот не найден' });
      }

      // Check if lot is active
      if (lot.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Лот не активен' });
      }

      // Check if bid amount is higher than current price
      if (amount <= lot.currentPrice) {
        return res.status(400).json({ error: 'Ставка должна быть выше текущей цены' });
      }

      // Create bid
      const bid = await prisma.bid.create({
        data: {
          amount,
          userId: req.user!.userId,
          lotId
        }
      });

      // Update lot current price
      await prisma.lot.update({
        where: { id: lotId },
        data: { currentPrice: amount }
      });

      // Get bidder and seller information
      const [bidder, seller] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { name: true, email: true }
        }),
        prisma.user.findUnique({
          where: { id: lot.sellerId },
          select: { name: true, email: true }
        })
      ]);

      if (bidder && seller) {
        // Send notification to seller
        await prisma.notification.create({
          data: {
            userId: lot.sellerId,
            type: 'NEW_BID',
            message: `Новая ставка на ваш лот "${lot.title}" от ${bidder.name} (${bidder.email}) - ${amount}₽`,
            lotId: lot.id
          }
        });

        // Send notification to previous highest bidder if exists
        const previousHighestBid = await prisma.bid.findFirst({
          where: {
            lotId,
            userId: { not: req.user!.userId }
          },
          orderBy: { amount: 'desc' }
        });

        if (previousHighestBid) {
          await prisma.notification.create({
            data: {
              userId: previousHighestBid.userId,
              type: 'BID_OUTBID',
              message: `Ваша ставка на лот "${lot.title}" была перебита. Текущая цена: ${amount}₽`,
              lotId: lot.id
            }
          });
        }
      }

      return res.status(201).json(bid);
    } catch (error) {
      console.error('Error creating bid:', error);
      return res.status(500).json({ error: 'Не удалось создать ставку' });
    }
  }
);

// Delete bid (admin or owner)
router.delete('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const bidId = req.params.id;
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { lot: true }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Ставка не найдена' });
    }

    // Проверяем права доступа
    if (requestingUser?.role !== 'ADMIN' && bid.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этой ставки' });
    }

    // Проверяем статус лота
    if (bid.lot.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Нельзя удалить ставку для неактивного лота' });
    }

    // Удаляем ставку и обновляем текущую цену лота в транзакции
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Удаляем ставку
      await tx.bid.delete({
        where: { id: bidId }
      });

      // Находим следующую максимальную ставку
      const nextHighestBid = await tx.bid.findFirst({
        where: { lotId: bid.lotId },
        orderBy: { amount: 'desc' }
      });

      // Обновляем текущую цену лота
      await tx.lot.update({
        where: { id: bid.lotId },
        data: {
          currentPrice: nextHighestBid ? nextHighestBid.amount : bid.lot.startPrice
        }
      });
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting bid:', error);
    return res.status(500).json({ error: 'Не удалось удалить ставку' });
  }
});

export default router; 