import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  createShareComment,
  getShareComments,
  deleteShareComment,
  updateShareComment,
} from '../controllers/shareCommentController.js'

const router = express.Router()

// Create a comment on a share
router.post('/:shareId/comments', authenticate, createShareComment)

// Get all comments for a share
router.get('/:shareId/comments', getShareComments)

// Update a comment on a share
router.put('/comments/:commentId', authenticate, updateShareComment)

// Delete a comment from a share
router.delete('/comments/:commentId', authenticate, deleteShareComment)

export default router
