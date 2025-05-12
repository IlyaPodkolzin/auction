import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { Prisma } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const router = Router();

// Get bids for a lot
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
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить ставки' });
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

// Place a bid
router.post(
  '/',
  authenticateToken,
  [
    body('lotId').notEmpty(),
    body('amount').isFloat({ min: 0 })
  ],
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { lotId, amount } = req.body;

      const lot = await prisma.lot.findUnique({
        where: { id: lotId }
      });

      if (!lot) {
        return res.status(404).json({ error: 'Лот не найден' });
      }

      if (lot.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Лот неактивен' });
      }

      if (amount <= lot.currentPrice) {
        return res.status(400).json({ error: 'Ставка должна быть выше текущей цены' });
      }

      const bid = await prisma.bid.create({
        data: {
          amount: parseFloat(amount),
          lotId,
          userId: req.user!.userId
        }
      });

      await prisma.lot.update({
        where: { id: lotId },
        data: { currentPrice: parseFloat(amount) }
      });

      res.status(201).json(bid);
    } catch (error) {
      res.status(500).json({ error: 'Не удалось разместить ставку' });
    }
  }
);

// Delete bid (admin or owner)
router.delete('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const bidId = req.params.id;
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    }) as UserWithRole | null;

    if (!requestingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Get the bid and check if it belongs to the user
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        lot: true
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Ставка не найдена' });
    }

    // Проверяем права доступа (админ или владелец ставки)
    if (requestingUser.role !== 'ADMIN' && bid.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Нельзя удалить чужую ставку' });
    }

    // Check if the lot is still active
    if (bid.lot.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Нельзя удалить ставку для завершенного лота' });
    }

    // Delete the bid in a transaction
    await prisma.$transaction(async (prisma) => {
      // Delete the bid
      await prisma.bid.delete({
        where: { id: bidId }
      });

      // Update lot's current price if needed
      const lot = await prisma.lot.findUnique({
        where: { id: bid.lotId },
        include: {
          bids: {
            orderBy: {
              amount: 'desc'
            }
          }
        }
      });

      if (lot && lot.bids.length > 0) {
        // If there are other bids, set current price to the highest remaining bid
        await prisma.lot.update({
          where: { id: lot.id },
          data: { currentPrice: lot.bids[0].amount }
        });
      } else if (lot) {
        // If no bids left, set current price to start price
        await prisma.lot.update({
          where: { id: lot.id },
          data: { currentPrice: lot.startPrice }
        });
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Ошибка при удалении ставки:', error);
    res.status(500).json({ error: 'Не удалось удалить ставку' });
  }
});

export default router; 