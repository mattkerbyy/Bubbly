import { PrismaClient } from '@prisma/client'
import { createNotification } from './notificationController.js'

const prisma = new PrismaClient()

/**
 * @route   POST /api/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId } = req.params

    // Check if trying to follow self
    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot follow yourself',
      })
    }

    // Check if user to follow exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Check if already following
    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    })

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'You are already following this user',
      })
    }

    // Create follow relationship
    const follow = await prisma.follower.create({
      data: {
        followerId: currentUserId,
        followingId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
      },
    })

    // Create notification for the followed user
    await createNotification({
      type: 'follow',
      senderId: currentUserId,
      recipientId: userId,
      content: 'started following you',
    })

    res.status(201).json({
      success: true,
      data: follow,
    })
  } catch (error) {
    // Follow user failed
    res.status(500).json({
      success: false,
      error: 'Failed to follow user',
    })
  }
}

/**
 * @route   DELETE /api/follow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId } = req.params

    // Check if following
    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    })

    if (!existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'You are not following this user',
      })
    }

    // Delete follow relationship
    await prisma.follower.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    })

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
    })
  } catch (error) {
    // Unfollow user failed
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user',
    })
  }
}

/**
 * @route   GET /api/follow/:userId/followers
 * @desc    Get user's followers
 * @access  Private
 */
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get followers
    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
            bio: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
    })

    // Check if current user is following each follower
    const followerIds = followers.map((f) => f.follower.id)
    const currentUserFollowing = await prisma.follower.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    })

    const followingSet = new Set(currentUserFollowing.map((f) => f.followingId))

    // Add isFollowing flag
    const followersWithStatus = followers.map((f) => ({
      ...f.follower,
      isFollowing: followingSet.has(f.follower.id),
      followedAt: f.createdAt,
    }))

    // Get total count
    const totalFollowers = await prisma.follower.count({
      where: { followingId: userId },
    })

    res.json({
      success: true,
      data: followersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowers / parseInt(limit)),
        total: totalFollowers,
        hasMore: skip + followers.length < totalFollowers,
      },
    })
  } catch (error) {
    // Get followers failed
    res.status(500).json({
      success: false,
      error: 'Failed to fetch followers',
    })
  }
}

/**
 * @route   GET /api/follow/:userId/following
 * @desc    Get users that this user is following
 * @access  Private
 */
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get following
    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
            bio: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
    })

    // Check if current user is following each person
    const followingIds = following.map((f) => f.following.id)
    const currentUserFollowing = await prisma.follower.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    })

    const followingSet = new Set(currentUserFollowing.map((f) => f.followingId))

    // Add isFollowing flag
    const followingWithStatus = following.map((f) => ({
      ...f.following,
      isFollowing: followingSet.has(f.following.id),
      followedAt: f.createdAt,
    }))

    // Get total count
    const totalFollowing = await prisma.follower.count({
      where: { followerId: userId },
    })

    res.json({
      success: true,
      data: followingWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowing / parseInt(limit)),
        total: totalFollowing,
        hasMore: skip + following.length < totalFollowing,
      },
    })
  } catch (error) {
    // Get following failed
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following',
    })
  }
}

/**
 * @route   GET /api/follow/:userId/status
 * @desc    Check if current user is following a user
 * @access  Private
 */
export const checkFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { userId } = req.params

    const follow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    })

    res.json({
      success: true,
      data: {
        isFollowing: !!follow,
      },
    })
  } catch (error) {
    // Check follow status failed
    res.status(500).json({
      success: false,
      error: 'Failed to check follow status',
    })
  }
}

/**
 * @route   GET /api/follow/suggestions
 * @desc    Get suggested users to follow
 * @access  Private
 */
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const { limit = 5 } = req.query

    // Get users that current user is not following
    const currentFollowing = await prisma.follower.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    })

    const followingIds = currentFollowing.map((f) => f.followingId)

    // Get suggested users (exclude self and already following)
    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, currentUserId],
        },
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
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      orderBy: [
        { verified: 'desc' },
        { followers: { _count: 'desc' } },
      ],
    })

    res.json({
      success: true,
      data: suggestedUsers,
    })
  } catch (error) {
    // Get suggested users failed
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggested users',
    })
  }
}
