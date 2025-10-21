// Backend server entry point
import express from 'express';
import logger from './utils/logger.js'
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import reactionRoutes from './routes/reactionRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import shareReactionRoutes from './routes/shareReactionRoutes.js';
import shareCommentRoutes from './routes/shareCommentRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import followRoutes from './routes/followRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

dotenv.config();

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Store online users (userId -> Set of socketIds)
const onlineUsers = new Map();
app.locals.onlineUsers = onlineUsers;

const restoreAccountStatus = async () => {
  try {
    await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true }
    });
  } catch (error) {
    logger.warn('Failed to restore account active status:', error);
  }
};

restoreAccountStatus();

const addUserConnection = (userId, socketId) => {
  const existing = onlineUsers.get(userId);

  if (existing) {
    existing.add(socketId);
    return false;
  }

  onlineUsers.set(userId, new Set([socketId]));
  return true;
};

const removeUserConnection = (userId, socketId) => {
  const existing = onlineUsers.get(userId);

  if (!existing) {
    return true;
  }

  existing.delete(socketId);

  if (existing.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  onlineUsers.set(userId, existing);
  return false;
};

const emitToUserRoom = (userId, event, payload) => {
  if (!userId) {
    return;
  }

  io.to(userId).emit(event, payload);
};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bubbly API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/share-reactions', shareReactionRoutes);
app.use('/api/share-comments', shareCommentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId || decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  const userId = socket.userId;
  // User connected

  if (!userId) {
    logger.warn('Socket connected without userId');
    socket.disconnect(true);
    return;
  }

  // Join user's personal room
  socket.join(userId);

  const isFirstConnection = addUserConnection(userId, socket.id);

  if (isFirstConnection) {
    io.emit('user-status', { userId, isOnline: true });
  }

  // Handle typing indicator
  socket.on('typing-start', ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, 'user-typing', {
      conversationId,
      userId
    })
  });

  socket.on('typing-stop', ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, 'user-stopped-typing', {
      conversationId,
      userId
    })
  });

  // Handle new message (real-time delivery)
  socket.on('send-message', ({ message, recipientId }) => {
    emitToUserRoom(recipientId, 'new-message', message)
  });

  // Handle message read receipt
  socket.on('mark-read', ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, 'messages-read', {
      conversationId,
      userId
    })
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    const isNowOffline = removeUserConnection(userId, socket.id)

    if (!isNowOffline) {
      return
    }

    io.emit('user-status', { userId, isOnline: false });
  });
});

// Make io accessible in req object
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});
