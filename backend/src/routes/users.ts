import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { Prisma } from '@prisma/client';

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
      .filter(bid => bid.lot.status === 'COMPLETED' && bid.amount === bid.lot.currentPrice)
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

export default router; 