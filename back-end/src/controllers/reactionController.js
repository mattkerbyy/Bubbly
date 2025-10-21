import { PrismaClient } from '@prisma/client'
import { createNotification } from './notificationController.js'

const prisma = new PrismaClient()

// Valid reaction types
const REACTION_TYPES = ['Like', 'Heart', 'Laughing', 'Wow', 'Sad', 'Angry']

// Add or update reaction on a post
export const addOrUpdateReaction = async (req, res) => {
  try {
    const { postId } = req.params
    const { reactionType } = req.body
    const userId = req.user.id

    // Validate reaction type
    if (!REACTION_TYPES.includes(reactionType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid reaction type. Must be one of: ${REACTION_TYPES.join(', ')}` 
      })
    }

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

    // Check if user already reacted to the post
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    let reaction
    let isNewReaction = false

    if (existingReaction) {
      // Update existing reaction if it's different
      if (existingReaction.reactionType === reactionType) {
        // Same reaction - remove it (toggle off)
        await prisma.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        })

        const reactionCounts = await getReactionCounts(postId)

        return res.status(200).json({
          success: true,
          data: {
            reacted: false,
            reactionType: null,
            ...reactionCounts,
          },
          message: 'Reaction removed successfully',
        })
      } else {
        // Different reaction - update it
        reaction = await prisma.reaction.update({
          where: {
            id: existingReaction.id,
          },
          data: {
            reactionType,
          },
        })
      }
    } else {
      // Create new reaction
      reaction = await prisma.reaction.create({
        data: {
          postId,
          userId,
          reactionType,
        },
      })
      isNewReaction = true
    }

    // Create notification for post owner (only for new reactions, not updates)
    if (isNewReaction && post.userId !== userId) {
      await createNotification({
        type: 'reaction',
        senderId: userId,
        recipientId: post.userId,
        postId,
        reactionType, // Pass the actual reaction type
        content: `reacted ${reactionType} to your post`,
      })
    }

    // Get updated reaction counts
    const reactionCounts = await getReactionCounts(postId)

    return res.status(200).json({
      success: true,
      data: {
        reacted: true,
        reactionType: reaction.reactionType,
        ...reactionCounts,
      },
      message: isNewReaction ? 'Reaction added successfully' : 'Reaction updated successfully',
    })
  } catch (error) {
    console.error('Error adding/updating reaction:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to add/update reaction',
    })
  }
}

// Remove reaction from a post
export const removeReaction = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (!existingReaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Reaction not found' 
      })
    }

    await prisma.reaction.delete({
      where: {
        id: existingReaction.id,
      },
    })

    const reactionCounts = await getReactionCounts(postId)

    return res.status(200).json({
      success: true,
      data: {
        reacted: false,
        reactionType: null,
        ...reactionCounts,
      },
      message: 'Reaction removed successfully',
    })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to remove reaction',
    })
  }
}

// Get reactions for a post with user details
export const getPostReactions = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20, reactionType } = req.query
    const currentUserId = req.user?.id

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

    // Build where clause
    const whereClause = { postId }
    if (reactionType && REACTION_TYPES.includes(reactionType)) {
      whereClause.reactionType = reactionType
    }

    // Get reactions with user details
    const reactions = await prisma.reaction.findMany({
      where: whereClause,
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

    // Add isFollowing status for each user
    const reactionsWithFollowStatus = await Promise.all(
      reactions.map(async (reaction) => {
        const isFollowing = currentUserId && currentUserId !== reaction.user.id
          ? await prisma.follower.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: reaction.user.id,
                },
              },
            })
          : null

        return {
          ...reaction,
          user: {
            ...reaction.user,
            isFollowing: !!isFollowing,
          },
        }
      })
    )

    // Get total count
    const totalReactions = await prisma.reaction.count({
      where: whereClause,
    })

    // Get reaction counts by type
    const reactionCounts = await getReactionCounts(postId)

    return res.status(200).json({
      success: true,
      data: {
        reactions: reactionsWithFollowStatus,
        totalReactions,
        ...reactionCounts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReactions / parseInt(limit)),
        hasMore: skip + reactions.length < totalReactions,
      },
    })
  } catch (error) {
    console.error('Error getting post reactions:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get post reactions',
    })
  }
}

// Check current user's reaction on a post
export const checkUserReaction = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    const reaction = await prisma.reaction.findUnique({
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
        reacted: !!reaction,
        reactionType: reaction?.reactionType || null,
      },
    })
  } catch (error) {
    console.error('Error checking user reaction:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check reaction status',
    })
  }
}

// Get posts reacted by a user
export const getUserReactedPosts = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get reacted posts
    const reactedPosts = await prisma.reaction.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
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
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
            reactions: {
              where: { userId: currentUserId },
              select: { 
                id: true,
                reactionType: true,
              },
            },
          },
        },
      },
    })

    // Format the response
    const posts = reactedPosts.map((reaction) => ({
      ...reaction.post,
      userReaction: reaction.post.reactions[0]?.reactionType || null,
      reactions: undefined, // Remove the reactions array used for checking
    }))

    // Get total count
    const totalReactions = await prisma.reaction.count({
      where: { userId },
    })

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReactions / parseInt(limit)),
        total: totalReactions,
        hasMore: skip + reactedPosts.length < totalReactions,
      },
    })
  } catch (error) {
    console.error('Error getting user reacted posts:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get reacted posts',
    })
  }
}

// Helper function to get reaction counts by type
async function getReactionCounts(postId) {
  const reactions = await prisma.reaction.groupBy({
    by: ['reactionType'],
    where: { postId },
    _count: {
      reactionType: true,
    },
  })

  const counts = {
    totalReactions: 0,
    reactionCounts: {},
  }

  reactions.forEach((r) => {
    counts.reactionCounts[r.reactionType] = r._count.reactionType
    counts.totalReactions += r._count.reactionType
  })

  // Ensure all reaction types are represented
  REACTION_TYPES.forEach((type) => {
    if (!counts.reactionCounts[type]) {
      counts.reactionCounts[type] = 0
    }
  })

  return counts
}
