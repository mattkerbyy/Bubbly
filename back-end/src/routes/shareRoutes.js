import express from 'express'
import { 
  sharePost, 
  unsharePost, 
  getPostShares, 
  checkUserShared,
  getUserShares,
  updateShare,
} from '../controllers/shareController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get posts shared by a user (must be before /:postId to avoid conflict)
router.get('/user/:userId', getUserShares)

// Share a post
router.post('/post/:postId', sharePost)

// Update share caption
router.put('/:shareId', updateShare)

// Unshare a post
router.delete('/:postId', unsharePost)

// Check if current user shared a post (must be before generic :postId route)
router.get('/:postId/check', checkUserShared)

// Get shares for a post
router.get('/:postId', getPostShares)

export default router
