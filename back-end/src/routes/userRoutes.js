import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { profileUpload } from '../config/multer.js'
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  getUserPosts,
  searchUsers,
  deleteAccount,
} from '../controllers/userController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Search users
router.get('/search', searchUsers)

// Get user profile by username
router.get('/:username', getProfile)

// Update profile info
router.put('/profile', updateProfile)

// Upload avatar
router.put('/avatar', profileUpload.single('avatar'), uploadAvatar)

// Delete avatar
router.delete('/avatar', deleteAvatar)

// Upload cover photo
router.put('/cover', profileUpload.single('cover'), uploadCover)

// Delete cover photo
router.delete('/cover', deleteCover)

// Get user posts
router.get('/:username/posts', getUserPosts)

// Delete account
router.delete('/account', deleteAccount)

export default router
