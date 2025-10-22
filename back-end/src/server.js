import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import logger from "./utils/LoggerFeature/logger.js";
import authRoutes from "./routes/AuthFeature/authRoutes.js";
import postRoutes from "./routes/PostFeature/postRoutes.js";
import reactionRoutes from "./routes/ReactionFeature/reactionRoutes.js";
import shareRoutes from "./routes/ShareFeature/shareRoutes.js";
import shareReactionRoutes from "./routes/ShareFeature/shareReactionRoutes.js";
import shareCommentRoutes from "./routes/ShareFeature/shareCommentRoutes.js";
import commentRoutes from "./routes/CommentFeature/commentRoutes.js";
import userRoutes from "./routes/UserFeature/userRoutes.js";
import followRoutes from "./routes/FollowFeature/followRoutes.js";
import notificationRoutes from "./routes/NotifFeature/notificationRoutes.js";
import searchRoutes from "./routes/SearchFeature/searchRoutes.js";
import messageRoutes from "./routes/MessageFeature/messageRoutes.js";

dotenv.config();

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;
const onlineUsers = new Map();
app.locals.onlineUsers = onlineUsers;

const restoreAccountStatus = async () => {
  try {
    await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });
  } catch (error) {
    logger.warn("Failed to restore account active status:", error);
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

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Bubbly API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/share-reactions", shareReactionRoutes);
app.use("/api/share-comments", shareCommentRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/messages", messageRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId || decoded.id;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;

  if (!userId) {
    logger.warn("Socket connected without userId");
    socket.disconnect(true);
    return;
  }

  socket.join(userId);

  const isFirstConnection = addUserConnection(userId, socket.id);

  if (isFirstConnection) {
    io.emit("user-status", { userId, isOnline: true });
  }

  socket.on("typing-start", ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, "user-typing", {
      conversationId,
      userId,
    });
  });

  socket.on("typing-stop", ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, "user-stopped-typing", {
      conversationId,
      userId,
    });
  });

  socket.on("send-message", ({ message, recipientId }) => {
    emitToUserRoom(recipientId, "new-message", message);
  });

  socket.on("mark-read", ({ conversationId, otherUserId }) => {
    emitToUserRoom(otherUserId, "messages-read", {
      conversationId,
      userId,
    });
  });

  socket.on("disconnect", async () => {
    const isNowOffline = removeUserConnection(userId, socket.id);

    if (!isNowOffline) {
      return;
    }

    io.emit("user-status", { userId, isOnline: false });
  });
});

app.set("io", io);

app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});
