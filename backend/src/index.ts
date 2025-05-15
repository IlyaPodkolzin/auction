import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeWebSocket } from './websocket';
import authRoutes from './routes/auth';
import lotRoutes from './routes/lots';
import bidRoutes from './routes/bids';
import userRoutes from './routes/users';
import { PrismaClient } from '@prisma/client';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
initializeWebSocket(httpServer);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  // Server started
}); 