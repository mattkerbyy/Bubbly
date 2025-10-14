import express from 'express'
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all notifications
router.get('/', getAllNotifications)

// Get unread count
router.get('/unread-count', getUnreadCount)

// Mark all notifications as read
router.put('/read-all', markAllAsRead)

// Mark single notification as read
router.put('/:id/read', markAsRead)

// Delete all notifications
router.delete('/', deleteAllNotifications)

// Delete single notification
router.delete('/:id', deleteNotification)

export default router
