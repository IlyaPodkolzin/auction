import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get user's notifications
router.get('/', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        lot: {
          select: {
            id: true,
            title: true,
            images: true
          }
        }
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.userId,
        read: false
      },
      data: { read: true }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete all notifications for a user
router.delete('/', authenticateToken, async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.userId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

export default router; 