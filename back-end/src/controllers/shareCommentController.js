import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create a comment on a share
export const createShareComment = async (req, res) => {
  try {
    const { shareId } = req.params
    const { content } = req.body
    const userId = req.user.id

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' })
    }

    // Check if share exists
    const share = await prisma.share.findUnique({
      where: { id: shareId },
      include: { user: true }
    })

    if (!share) {
      return res.status(404).json({ error: 'Share not found' })
    }

    const comment = await prisma.shareComment.create({
      data: {
        content: content.trim(),
        shareId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Create notification if commenting on someone else's share
    if (share.userId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'comment',
          content: `commented on your shared post`,
          senderId: userId,
          recipientId: share.userId,
          shareId: shareId
        }
      })
    }

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error creating share comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
}

// Get all comments for a share
export const getShareComments = async (req, res) => {
  try {
    const { shareId } = req.params
    const { cursor, limit = 20 } = req.query

    const where = { shareId }

    const comments = await prisma.shareComment.findMany({
      where,
      take: parseInt(limit) + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    const hasMore = comments.length > parseInt(limit)
    const commentsToReturn = hasMore ? comments.slice(0, -1) : comments
    const nextCursor = hasMore ? commentsToReturn[commentsToReturn.length - 1].id : null

    res.status(200).json({
      comments: commentsToReturn,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('Error fetching share comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
}

// Update a comment on a share
export const updateShareComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user.id

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' })
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Comment content must be 500 characters or less' })
    }

    const existingComment = await prisma.shareComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this comment' })
    }

    const updatedComment = await prisma.shareComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    res.status(200).json(updatedComment)
  } catch (error) {
    console.error('Error updating share comment:', error)
    res.status(500).json({ error: 'Failed to update comment' })
  }
}

// Delete a comment from a share
export const deleteShareComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user.id

    const comment = await prisma.shareComment.findUnique({
      where: { id: commentId },
      include: {
        share: {
          select: { userId: true }
        }
      }
    })

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Only the comment author or share owner can delete
    if (comment.userId !== userId && comment.share.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' })
    }

    await prisma.shareComment.delete({
      where: { id: commentId }
    })

    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting share comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
}
