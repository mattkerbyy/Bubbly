import express from 'express'
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts
} from '../controllers/postController.js'
import { authenticate } from '../middleware/auth.js'
import { uploadPostImage } from '../config/multer.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all posts (feed) and create new post
router
  .route('/')
  .get(getAllPosts)
  .post(uploadPostImage.array('files', 10), createPost) // Support up to 10 files

// Get posts by specific user
router.get('/user/:userId', getUserPosts)

// Get, update, and delete specific post
router
  .route('/:id')
  .get(getPostById)
  .put(uploadPostImage.array('files', 10), updatePost) // Support up to 10 files
  .delete(deletePost)

export default router
