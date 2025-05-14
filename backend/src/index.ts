import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import lotRoutes from './routes/lots';
import bidRoutes from './routes/bids';
import { setupWebSocket } from './websocket';
import notificationsRouter from './routes/notifications';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

export const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', userRoutes);

// WebSocket setup
setupWebSocket(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 