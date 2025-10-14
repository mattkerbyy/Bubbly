import express from 'express'
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getSuggestedUsers,
} from '../controllers/followController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Follow/unfollow routes
router.post('/:userId', followUser)
router.delete('/:userId', unfollowUser)

// Get followers and following
router.get('/:userId/followers', getFollowers)
router.get('/:userId/following', getFollowing)

// Check follow status
router.get('/:userId/status', checkFollowStatus)

// Get suggested users to follow
router.get('/suggestions/users', getSuggestedUsers)

export default router
