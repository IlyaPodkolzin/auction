import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { updateLotStatus } from '../utils/lotStatus';
import path from 'path';

const router = Router();

// Define categories enum
const Category = {
  ANTIQUES: 'ANTIQUES',
  ART: 'ART',
  AUTOMOBILES: 'AUTOMOBILES',
  BOOKS: 'BOOKS',
  CLOTHING: 'CLOTHING',
  COLLECTIBLES: 'COLLECTIBLES',
  COMPUTERS: 'COMPUTERS',
  ELECTRONICS: 'ELECTRONICS',
  FURNITURE: 'FURNITURE',
  HOME_DECOR: 'HOME_DECOR',
  JEWELRY: 'JEWELRY',
  MUSICAL_INSTRUMENTS: 'MUSICAL_INSTRUMENTS',
  SPORTS_EQUIPMENT: 'SPORTS_EQUIPMENT',
  STAMPS: 'STAMPS',
  TOYS: 'TOYS',
  VINTAGE_ITEMS: 'VINTAGE_ITEMS',
  WATCHES: 'WATCHES',
  WINE: 'WINE',
  WINE_ACCESSORIES: 'WINE_ACCESSORIES',
  OTHER: 'OTHER'
} as const;

type CategoryType = typeof Category[keyof typeof Category];

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all lots with search and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      status,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};

    if (search) {
      where.title = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (minPrice || maxPrice) {
      where.currentPrice = {};
      if (minPrice) where.currentPrice.gte = parseFloat(minPrice as string);
      if (maxPrice) where.currentPrice.lte = parseFloat(maxPrice as string);
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const lots = await prisma.lot.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy
    });

    // Update status for each lot
    await Promise.all(lots.map(lot => updateLotStatus(lot.id)));

    // Fetch updated lots
    const updatedLots = await prisma.lot.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy
    });

    // Add default image if no images exist
    const lotsWithDefaultImage = updatedLots.map(lot => ({
      ...lot,
      images: lot.images.length > 0 ? lot.images : ['default-lot.jpg']
    }));

    res.json(lotsWithDefaultImage);
  } catch (error) {
    console.error('Error fetching lots:', error);
    res.status(500).json({ error: 'Failed to fetch lots' });
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
    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user lots' });
  }
});

// Get single lot
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
        }
      }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    // Update lot status
    await updateLotStatus(lot.id);

    // Fetch updated lot
    const updatedLot = await prisma.lot.findUnique({
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
        }
      }
    });

    res.json(updatedLot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lot' });
  }
});

// Create a new lot
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('startPrice').isFloat({ min: 0 }),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('category').isIn(Object.values(Category))
  ],
  async (req: Request & { user?: { userId: string } }, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, startPrice, startTime, endTime, category } = req.body;
      const images = (req.files as Express.Multer.File[]).map(file => file.filename);

      const lot = await prisma.lot.create({
        data: {
          title,
          description,
          startPrice: parseFloat(startPrice),
          currentPrice: parseFloat(startPrice),
          images: images.length > 0 ? images : ['default-lot.jpg'],
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          category: category as CategoryType,
          sellerId: req.user!.userId
        }
      });

      res.status(201).json(lot);
    } catch (error) {
      console.error('Error creating lot:', error);
      res.status(500).json({ error: 'Failed to create lot' });
    }
  }
);

// Update lot status
router.patch('/:id/status', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { status } = req.body;
    const lot = await prisma.lot.findUnique({
      where: { id: req.params.id }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    if (lot.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedLot = await prisma.lot.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updatedLot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lot status' });
  }
});

// Delete lot (admin or owner)
router.delete('/:id', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const lotId = req.params.id;
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    const lot = await prisma.lot.findUnique({
      where: { id: lotId }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Лот не найден' });
    }

    // Проверяем права доступа
    if (requestingUser?.role !== 'ADMIN' && lot.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этого лота' });
    }

    // Get unique bidders before deleting the lot
    const bidders = await prisma.bid.findMany({
      where: { lotId },
      select: { userId: true },
      distinct: ['userId']
    });

    const uniqueBidderIds = bidders.map(bid => bid.userId);

    // Save lot title for notifications
    const lotTitle = lot.title;

    // Delete the lot and all related data in a transaction
    await prisma.$transaction(async (prisma) => {
      // Delete all bids and notifications related to the lot
      await prisma.bid.deleteMany({
        where: { lotId }
      });

      await prisma.notification.deleteMany({
        where: { lotId }
      });

      // Delete the lot
      await prisma.lot.delete({
        where: { id: lotId }
      });
    });

    // Create notifications for all bidders
    await Promise.all(
      uniqueBidderIds.map(bidderId =>
        prisma.notification.create({
          data: {
            userId: bidderId,
            type: 'LOT_DELETED',
            message: `Лот "${lotTitle}" был удален`
          }
        })
      )
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting lot:', error);
    res.status(500).json({ error: 'Не удалось удалить лот' });
  }
});

export default router; 