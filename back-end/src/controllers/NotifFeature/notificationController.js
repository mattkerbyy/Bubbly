import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            file: true,
            files: true,
          },
        },
      },
    });

    const totalNotifications = await prisma.notification.count({
      where: { recipientId: userId },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / parseInt(limit)),
        total: totalNotifications,
        hasMore: skip + notifications.length < totalNotifications,
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this notification",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            file: true,
            files: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this notification",
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { recipientId: userId },
    });

    res.json({
      success: true,
      message: "All notifications deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete all notifications",
    });
  }
};

export const createNotification = async ({
  type,
  senderId,
  recipientId,
  postId,
  shareId,
  content,
  reactionType,
}) => {
  try {
    if (senderId === recipientId) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        reactionType,
        senderId,
        recipientId,
        postId,
        shareId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            file: true,
            files: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};
