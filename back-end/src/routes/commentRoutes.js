import express from 'express'
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// All comment routes require authentication
router.use(authenticate)

// Create a comment on a post
router.post('/posts/:postId', createComment)

// Get comments for a post (paginated)
router.get('/posts/:postId', getPostComments)

// Update a comment
router.put('/:commentId', updateComment)

// Delete a comment
router.delete('/:commentId', deleteComment)

export default router
