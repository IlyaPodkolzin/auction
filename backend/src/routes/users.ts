import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Если это не админ и не свой профиль, скрываем email
    if (requestingUser?.role !== 'ADMIN' && req.user!.userId !== user.id) {
      delete user.email;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Не удалось получить информацию о пользователе' });
  }
});

// Get user statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const [totalLots, soldLots] = await Promise.all([
      prisma.lot.count({
        where: { sellerId: req.params.id }
      }),
      prisma.lot.count({
        where: {
          sellerId: req.params.id,
          status: 'SOLD'
        }
      })
    ]);

    res.json({ totalLots, soldLots });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Не удалось получить статистику пользователя' });
  }
});

// Delete user account (admin or self)
router.delete('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const userId = req.params.id;
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    // Проверяем права доступа
    if (requestingUser?.role !== 'ADMIN' && userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этого аккаунта' });
    }

    // Delete user account and all related data in a transaction
    await prisma.$transaction(async (prisma) => {
      // Get all active lots where user has bids
      const activeLotsWithBids = await prisma.lot.findMany({
        where: {
          status: 'ACTIVE',
          bids: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          bids: {
            orderBy: {
              amount: 'desc'
            }
          }
        }
      });

      // Update current price for active lots where user had the highest bid
      for (const lot of activeLotsWithBids) {
        const userBids = lot.bids.filter(bid => bid.userId === userId);
        const highestUserBid = Math.max(...userBids.map(bid => bid.amount));
        
        if (lot.currentPrice === highestUserBid) {
          // Find the next highest bid
          const nextHighestBid = lot.bids.find(bid => bid.userId !== userId);
          if (nextHighestBid) {
            await prisma.lot.update({
              where: { id: lot.id },
              data: { currentPrice: nextHighestBid.amount }
            });
          } else {
            // If no other bids, set price to start price
            await prisma.lot.update({
              where: { id: lot.id },
              data: { currentPrice: lot.startPrice }
            });
          }
        }
      }

      // Get all lots created by the user
      const userLots = await prisma.lot.findMany({
        where: { sellerId: userId },
        select: { id: true }
      });

      // Delete all notifications related to user's lots
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { userId },
            { lotId: { in: userLots.map(lot => lot.id) } }
          ]
        }
      });

      // Delete all bids related to user's lots
      await prisma.bid.deleteMany({
        where: {
          OR: [
            { userId },
            { lotId: { in: userLots.map(lot => lot.id) } }
          ]
        }
      });

      // Delete all user's lots
      await prisma.lot.deleteMany({
        where: { sellerId: userId }
      });

      // Finally delete the user
      await prisma.user.delete({
        where: { id: userId }
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Не удалось удалить аккаунт пользователя' });
  }
});

export default router; 