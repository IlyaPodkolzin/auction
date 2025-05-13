import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Не удалось получить профиль пользователя' });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { name, profileImage } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        name,
        profileImage
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true
      }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Не удалось обновить профиль пользователя' });
  }
});

// Get user's bids
router.get('/bids', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { userId: req.user!.userId },
      include: {
        lot: {
          select: {
            id: true,
            title: true,
            images: true,
            currentPrice: true,
            status: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(bids);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return res.status(500).json({ error: 'Не удалось получить ставки пользователя' });
  }
});

// Get user's lots
router.get('/lots', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const lots = await prisma.lot.findMany({
      where: { sellerId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(lots);
  } catch (error) {
    console.error('Error fetching user lots:', error);
    return res.status(500).json({ error: 'Не удалось получить лоты пользователя' });
  }
});

// Get user's won lots
router.get('/won-lots', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const userBids = await prisma.bid.findMany({
      where: { userId: req.user!.userId },
      include: {
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const wonLots = userBids
      .filter(bid => bid.lot.status === 'SOLD' && bid.amount === bid.lot.currentPrice)
      .map(bid => bid.lot);

    return res.json(wonLots);
  } catch (error) {
    console.error('Error fetching won lots:', error);
    return res.status(500).json({ error: 'Не удалось получить выигранные лоты' });
  }
});

// Get user's active bids
router.get('/active-bids', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const userBids = await prisma.bid.findMany({
      where: { userId: req.user!.userId },
      include: {
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeBids = userBids.filter(bid => bid.lot.status === 'ACTIVE');
    const highestBids = activeBids.reduce((acc: { [key: string]: typeof activeBids[0] }, bid) => {
      if (!acc[bid.lotId] || bid.amount > acc[bid.lotId].amount) {
        acc[bid.lotId] = bid;
      }
      return acc;
    }, {});

    return res.json(Object.values(highestBids));
  } catch (error) {
    console.error('Error fetching active bids:', error);
    return res.status(500).json({ error: 'Не удалось получить активные ставки' });
  }
});

// Get user's active lots
router.get('/active-lots', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const lots = await prisma.lot.findMany({
      where: {
        sellerId: req.user!.userId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(lots);
  } catch (error) {
    console.error('Error fetching active lots:', error);
    return res.status(500).json({ error: 'Не удалось получить активные лоты' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add isOwner flag if user is authenticated
    const isOwner = req.user?.userId === user.id;

    return res.json({
      ...user,
      isOwner
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const [activeLots, soldLots, totalBids, totalLots] = await Promise.all([
      prisma.lot.count({
        where: {
          sellerId: userId,
          status: 'ACTIVE'
        }
      }),
      prisma.lot.count({
        where: {
          sellerId: userId,
          status: 'SOLD'
        }
      }),
      prisma.bid.count({
        where: {
          userId: userId
        }
      }),
      prisma.lot.count({
        where: {
          sellerId: userId
        }
      })
    ]);

    return res.json({
      activeLots,
      soldLots,
      totalBids,
      totalLots
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
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

  return null;
});

export default router; 