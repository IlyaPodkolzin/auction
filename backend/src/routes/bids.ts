import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

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
    res.status(500).json({ error: 'Failed to fetch bids' });
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
    res.status(500).json({ error: 'Failed to fetch user bids' });
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
        return res.status(404).json({ error: 'Lot not found' });
      }

      if (lot.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Lot is not active' });
      }

      if (amount <= lot.currentPrice) {
        return res.status(400).json({ error: 'Bid must be higher than current price' });
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
      res.status(500).json({ error: 'Failed to place bid' });
    }
  }
);

export default router; 