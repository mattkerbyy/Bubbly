import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
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
    })

    // Get total count
    const totalNotifications = await prisma.notification.count({
      where: { recipientId: userId },
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    })

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
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    })
  }
}

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    })

    res.json({
      success: true,
      data: { unreadCount },
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
    })
  }
}

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      })
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this notification',
      })
    }

    // Mark as read
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
    })

    res.json({
      success: true,
      data: updatedNotification,
    })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    })
  }
}

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    res.json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    console.error('Mark all as read error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    })
  }
}

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      })
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notification',
      })
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    })
  }
}

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for current user
 * @access  Private
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id

    await prisma.notification.deleteMany({
      where: { recipientId: userId },
    })

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
    })
  } catch (error) {
    console.error('Delete all notifications error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete all notifications',
    })
  }
}

/**
 * Helper function to create a notification
 * Used by other controllers (likes, comments, follows)
 */
export const createNotification = async ({ type, senderId, recipientId, postId, content }) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (senderId === recipientId) {
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        senderId,
        recipientId,
        postId,
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
    })

    return notification
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}
