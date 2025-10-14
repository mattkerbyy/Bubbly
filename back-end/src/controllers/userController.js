import { PrismaClient } from '@prisma/client'
import { body, validationResult } from 'express-validator'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile by username
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const { username } = req.params
    const currentUserId = req.user.id

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Check if current user is following this user
    const isFollowing = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    })

    res.json({
      success: true,
      data: {
        ...user,
        isFollowing: !!isFollowing,
        isOwnProfile: currentUserId === user.id,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    })
  }
}

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = [
  // Validation
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),

  // Controller
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        })
      }

      const userId = req.user.id
      const { name, bio, location, website } = req.body

      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (bio !== undefined) updateData.bio = bio
      if (location !== undefined) updateData.location = location
      if (website !== undefined) updateData.website = website

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          avatar: true,
          coverPhoto: true,
          location: true,
          website: true,
          verified: true,
          createdAt: true,
        },
      })

      res.json({
        success: true,
        data: updatedUser,
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      })
    }
  },
]

/**
 * @route   PUT /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const userId = req.user.id
    const avatarPath = `/uploads/profiles/${req.file.filename}`

    // Get old avatar and delete it if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    })

    if (user.avatar) {
      try {
        const oldAvatarPath = path.join(__dirname, '../..', user.avatar)
        await fs.unlink(oldAvatarPath)
      } catch (error) {
        // Silently fail if old avatar cannot be deleted
      }
    }

    // Update user with new avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
    })
  }
}

/**
 * @route   PUT /api/users/cover
 * @desc    Upload user cover photo
 * @access  Private
 */
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const userId = req.user.id
    const coverPath = `/uploads/profiles/${req.file.filename}`

    // Get old cover and delete it if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverPhoto: true },
    })

    if (user.coverPhoto) {
      try {
        const oldCoverPath = path.join(__dirname, '../..', user.coverPhoto)
        await fs.unlink(oldCoverPath)
      } catch (error) {
        // Silently fail if old cover photo cannot be deleted
      }
    }

    // Update user with new cover photo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: coverPath },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Upload cover error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload cover photo',
    })
  }
}

/**
 * @route   GET /api/users/:username/posts
 * @desc    Get posts by user
 * @access  Private
 */
export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const currentUserId = req.user.id

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Get posts
    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    })

    // Add isLiked field
    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined,
    }))

    // Get total count
    const totalPosts = await prisma.post.count({
      where: { userId: user.id },
    })

    res.json({
      success: true,
      data: postsWithLikeStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user posts',
    })
  }
}

/**
 * @route   DELETE /api/users/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
export const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id

    // Get current avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    })

    if (user.avatar) {
      try {
        const avatarPath = path.join(__dirname, '../..', user.avatar)
        await fs.unlink(avatarPath)
      } catch (error) {
        // Silently fail if avatar file cannot be deleted
      }
    }

    // Update user with null avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Delete avatar error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar',
    })
  }
}

/**
 * @route   DELETE /api/users/cover
 * @desc    Delete user cover photo
 * @access  Private
 */
export const deleteCover = async (req, res) => {
  try {
    const userId = req.user.id

    // Get current cover
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverPhoto: true },
    })

    if (user.coverPhoto) {
      try {
        const coverPath = path.join(__dirname, '../..', user.coverPhoto)
        await fs.unlink(coverPath)
      } catch (error) {
        // Silently fail if cover photo file cannot be deleted
      }
    }

    // Update user with null cover photo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Delete cover error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete cover photo',
    })
  }
}

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or username
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: [],
      })
    }

    const searchTerm = q.toLowerCase()

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: parseInt(limit),
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        verified: true,
        bio: true,
      },
      orderBy: {
        verified: 'desc', // Show verified users first
      },
    })

    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    })
  }
}
