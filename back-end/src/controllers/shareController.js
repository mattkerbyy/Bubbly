import { PrismaClient } from '@prisma/client'
import { createNotification } from './notificationController.js'

const prisma = new PrismaClient()

// Share a post
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params
    const { shareCaption, audience } = req.body
    const userId = req.user.id

    // Validate audience type
    const validAudiences = ['Public', 'Following', 'OnlyMe']
    const shareAudience = validAudiences.includes(audience) ? audience : 'Public'

    // Check if post exists
    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    if (!targetPost) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Check if user can see the post based on audience settings
    if (targetPost.userId !== userId) {
      // OnlyMe posts cannot be shared by others
      if (targetPost.audience === 'OnlyMe') {
        return res.status(403).json({
          success: false,
          error: 'This post is private and cannot be shared'
        })
      }

      // Following posts can only be shared by people the author follows
      if (targetPost.audience === 'Following') {
        const postAuthorFollowsMe = await prisma.follower.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetPost.userId,
              followingId: userId,
            },
          },
        })

        if (!postAuthorFollowsMe) {
          return res.status(403).json({
            success: false,
            error: 'This post is only visible to people the author follows'
          })
        }
      }
    }

    // Check if user already shared this post
    const existingShare = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingShare) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already shared this post' 
      })
    }

    // Create share
    const share = await prisma.share.create({
      data: {
        postId,
        userId,
        shareCaption: shareCaption || null,
        audience: shareAudience,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    })

    // Create notification for post owner (if not sharing own post)
    if (targetPost.userId !== userId) {
      await createNotification({
        type: 'share',
        senderId: userId,
        recipientId: targetPost.userId,
        postId,
        content: 'shared your post',
      })
    }

    // Get updated share count
    const shareCount = await prisma.share.count({
      where: { postId },
    })

    // Emit socket event if available
    const io = req.app.get('io')
    if (io && targetPost.userId !== userId) {
      io.to(targetPost.userId).emit('new-share', {
        share,
        shareCount,
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        share,
        shareCount,
      },
      message: 'Post shared successfully',
    })
  } catch (error) {
    console.error('Error sharing post:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to share post',
    })
  }
}

// Unshare a post
export const unsharePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    // Find the share
    const share = await prisma.share.findFirst({
      where: {
        postId,
        userId,
      },
    })

    if (!share) {
      return res.status(404).json({ 
        success: false, 
        error: 'Share not found' 
      })
    }

    // Delete the share
    await prisma.share.delete({
      where: {
        id: share.id,
      },
    })

    // Get updated share count
    const shareCount = await prisma.share.count({
      where: { postId },
    })

    return res.status(200).json({
      success: true,
      data: {
        shareCount,
      },
      message: 'Post unshared successfully',
    })
  } catch (error) {
    console.error('Error unsharing post:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to unshare post',
    })
  }
}

// Get shares for a post
export const getPostShares = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20 } = req.query
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

    // Get shares with user details
    const shares = await prisma.share.findMany({
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

    // Add isFollowing status for each user
    const sharesWithFollowStatus = await Promise.all(
      shares.map(async (share) => {
        const isFollowing = currentUserId && currentUserId !== share.user.id
          ? await prisma.follower.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: share.user.id,
                },
              },
            })
          : null

        return {
          ...share,
          user: {
            ...share.user,
            isFollowing: !!isFollowing,
          },
        }
      })
    )

    // Get total count
    const totalShares = await prisma.share.count({
      where: { postId },
    })

    return res.status(200).json({
      success: true,
      data: {
        shares: sharesWithFollowStatus,
        totalShares,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShares / parseInt(limit)),
        hasMore: skip + shares.length < totalShares,
      },
    })
  } catch (error) {
    console.error('Error getting post shares:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get post shares',
    })
  }
}

// Get nested shares for a share (who reshared a share)
// Check if current user shared a post
export const checkUserShared = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.id

    const share = await prisma.share.findFirst({
      where: {
        postId,
        userId,
      },
    })

    return res.status(200).json({
      success: true,
      data: {
        shared: !!share,
      },
    })
  } catch (error) {
    console.error('Error checking user share:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check share status',
    })
  }
}

// Update share caption
export const updateShare = async (req, res) => {
  try {
    const { shareId } = req.params
    const { shareCaption, audience } = req.body
    const userId = req.user.id

    // Validate audience type if provided
    const validAudiences = ['Public', 'Following', 'OnlyMe']
    
    // Find the share
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    })

    if (!share) {
      return res.status(404).json({ 
        success: false, 
        error: 'Share not found' 
      })
    }

    // Check if user owns the share
    if (share.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to update this share' 
      })
    }

    // Prepare update data
    const updateData = {
      shareCaption: shareCaption !== undefined ? (shareCaption || null) : share.shareCaption,
      updatedAt: new Date(),
    }

    // Update audience if provided
    if (audience && validAudiences.includes(audience)) {
      updateData.audience = audience
    }

    // Update the share
    const updatedShare = await prisma.share.update({
      where: { id: shareId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    })

    return res.status(200).json({
      success: true,
      data: updatedShare,
      message: 'Share updated successfully',
    })
  } catch (error) {
    console.error('Error updating share:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update share',
    })
  }
}

// Get posts shared by a user (their share activity)
export const getUserShares = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get list of users who follow the current user (for "Following" audience posts)
    const followers = await prisma.follower.findMany({
      where: { followingId: currentUserId },
      select: { followerId: true },
    })
    const followerIds = followers.map((f) => f.followerId)

    // Get shared posts
    const shares = await prisma.share.findMany({
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
                shares: true,
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
    })

    // Filter shares based on post audience settings
    const filteredShares = shares.filter(share => {
      const post = share.post
      if (!post) return false

      // Own posts are always visible
      if (post.userId === currentUserId) return true

      // Public posts are visible to everyone
      if (post.audience === 'Public') return true

      // OnlyMe posts are only visible to the author
      if (post.audience === 'OnlyMe') return post.userId === currentUserId

      // Following posts: visible only if the post author follows the current user
      if (post.audience === 'Following') {
        return followerIds.includes(post.userId)
      }

      return false
    })

    // Format shares with userReaction as string
    const formattedShares = filteredShares.map(share => ({
      ...share,
      userReaction: share.reactions[0]?.reactionType || null,
      reactions: undefined, // Remove reactions array
      post: share.post ? {
        ...share.post,
        userReaction: share.post.reactions[0]?.reactionType || null,
        reactions: undefined, // Remove post reactions array
      } : share.post,
    }))

    // Get total count (after filtering)
    const totalShares = filteredShares.length

    return res.status(200).json({
      success: true,
      data: formattedShares,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShares / parseInt(limit)),
        total: totalShares,
        hasMore: skip + shares.length < totalShares,
      },
    })
  } catch (error) {
    console.error('Error getting user shares:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get user shares',
    })
  }
}
