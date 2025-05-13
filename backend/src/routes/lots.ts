import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { updateLotStatus } from '../utils/lotStatus';
import path from 'path';
import { Prisma, Category } from '@prisma/client';

const router = Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all lots
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, status, search, sort = 'createdAt', order = 'desc' } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LotWhereInput = {};
    if (category) where.category = category as Category;
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [lots, total] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          },
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true
                }
              }
            }
          }
        },
        orderBy: { [sort as string]: order },
        skip,
        take: limit
      }),
      prisma.lot.count({ where })
    ]);

    return res.json({
      lots: lots || [],
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching lots:', error);
    return res.json({
      lots: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
  }
});

// Get user's lots
router.get('/my-lots', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const lots = await prisma.lot.findMany({
      where: { sellerId: req.user!.userId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(lots);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user lots' });
  }
});

// Get lot by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lot = await prisma.lot.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Лот не найден' });
    }

    // Update lot status if needed
    await updateLotStatus(prisma, lot.id);

    return res.json(lot);
  } catch (error) {
    console.error('Error fetching lot:', error);
    return res.status(500).json({ error: 'Не удалось получить информацию о лоте' });
  }
});

// Create new lot
router.post('/', authenticateToken, upload.array('images', 5), async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { title, description, startPrice, startTime, endTime, category } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const images = files.length > 0 ? files.map(file => file.filename) : ['default-lot.jpg'];

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const lot = await prisma.lot.create({
      data: {
        title,
        description,
        startPrice: Number(startPrice),
        currentPrice: Number(startPrice),
        images,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        category: category as Category,
        sellerId: req.user.userId,
        status: 'PENDING'
      }
    });

    return res.status(201).json(lot);
  } catch (error) {
    console.error('Error creating lot:', error);
    return res.status(500).json({ error: 'Failed to create lot' });
  }
});

// Update lot
router.patch('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const lotId = req.params.id;
    const { title, description, images, category } = req.body;

    const lot = await prisma.lot.findUnique({
      where: { id: lotId }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Лот не найден' });
    }

    if (lot.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Нет прав для изменения этого лота' });
    }

    if (lot.status !== 'PENDING') {
      return res.status(400).json({ error: 'Нельзя изменить лот, который уже начался' });
    }

    const updatedLot = await prisma.lot.update({
      where: { id: lotId },
      data: {
        title,
        description,
        images,
        category: category as Category
      }
    });

    return res.json(updatedLot);
  } catch (error) {
    console.error('Error updating lot:', error);
    return res.status(500).json({ error: 'Не удалось обновить лот' });
  }
});

// Delete lot
router.delete('/:id', authenticateToken, async (req: Request & { user?: { userId: string; role: string } }, res: Response) => {
  try {
    const lotId = req.params.id;

    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        bids: {
          select: { userId: true }
        }
      }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Лот не найден' });
    }

    if (lot.sellerId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет прав для удаления этого лота' });
    }

    // Get unique bidders before deleting the lot
    const uniqueBidders = Array.from(new Set(lot.bids.map(bid => bid.userId)));

    // Save lot title for notifications
    const lotTitle = lot.title;

    // Delete the lot and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all notifications related to this lot
      await tx.notification.deleteMany({
        where: { lotId }
      });

      // Delete all bids for this lot
      await tx.bid.deleteMany({
        where: { lotId }
      });

      // Delete the lot
      await tx.lot.delete({
        where: { id: lotId }
      });
    });

    // Create notifications for all bidders
    await Promise.all(
      uniqueBidders.map(bidderId =>
        prisma.notification.create({
          data: {
            type: 'LOT_DELETED',
            message: `Лот "${lotTitle}" был удален продавцом`,
            userId: bidderId
          }
        })
      )
    );

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting lot:', error);
    return res.status(500).json({ error: 'Не удалось удалить лот' });
  }
});

export default router; 