import { PrismaClient } from '@prisma/client'
import { createNotification } from './notificationController.js'

const prisma = new PrismaClient()

// Toggle like on a post (like if not liked, unlike if already liked)
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingLike) {
      // Unlike: Delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      })

      // Get updated like count
      const likeCount = await prisma.like.count({
        where: { postId },
      })

      return res.status(200).json({
        success: true,
        data: {
          liked: false,
          likeCount,
        },
        message: 'Post unliked successfully',
      })
    } else {
      // Like: Create a new like
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      })

      // Create notification for post owner
      await createNotification({
        type: 'like',
        senderId: userId,
        recipientId: post.userId,
        postId,
        content: 'liked your post',
      })

      // Get updated like count
      const likeCount = await prisma.like.count({
        where: { postId },
      })

      return res.status(200).json({
        success: true,
        data: {
          liked: true,
          likeCount,
        },
        message: 'Post liked successfully',
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle like',
    })
  }
}

// Get likes for a post with user details
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Get likes with user details
    const likes = await prisma.like.findMany({
      where: { postId },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            verified: true,
          },
        },
      },
    })

    // Get total count
    const totalLikes = await prisma.like.count({
      where: { postId },
    })

    return res.status(200).json({
      success: true,
      data: {
        likes,
        totalLikes,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLikes / parseInt(limit)),
        hasMore: skip + likes.length < totalLikes,
      },
    })
  } catch (error) {
    console.error('Error getting post likes:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get post likes',
    })
  }
}

// Check if current user liked a post
export const checkUserLiked = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    return res.status(200).json({
      success: true,
      data: {
        liked: !!like,
      },
    })
  } catch (error) {
    console.error('Error checking user like:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check like status',
    })
  }
}
