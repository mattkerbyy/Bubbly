import express from 'express'
import { 
  addOrUpdateReaction, 
  removeReaction, 
  getPostReactions, 
  checkUserReaction,
  getUserReactedPosts 
} from '../controllers/reactionController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Add or update reaction to a post
router.post('/:postId', addOrUpdateReaction)

// Remove reaction from a post
router.delete('/:postId', removeReaction)

// Get reactions for a post (with optional filter by reaction type)
router.get('/:postId', getPostReactions)

// Check if current user reacted to a post
router.get('/:postId/check', checkUserReaction)

// Get posts reacted by a user
router.get('/user/:userId/posts', getUserReactedPosts)

export default router
