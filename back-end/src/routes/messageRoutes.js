import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getUnreadCount
} from '../controllers/messageController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all conversations
router.get('/conversations', getConversations)

// Get unread message count
router.get('/unread-count', getUnreadCount)

// Get or create conversation with another user
router.get('/conversations/user/:otherUserId', getOrCreateConversation)

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', getMessages)

// Send a message
router.post('/conversations/:conversationId/messages', sendMessage)

// Mark messages as read
router.patch('/conversations/:conversationId/read', markMessagesAsRead)

// Delete a conversation
router.delete('/conversations/:conversationId', deleteConversation)

export default router
