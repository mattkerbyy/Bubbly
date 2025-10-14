import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { searchUsers, searchPosts, searchAll } from '../controllers/searchController.js'

const router = express.Router()

// All search routes require authentication
router.use(authenticate)

// Search routes
router.get('/users', searchUsers)
router.get('/posts', searchPosts)
router.get('/all', searchAll)

export default router
