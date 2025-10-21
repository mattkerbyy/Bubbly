import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id
    const { otherUserId } = req.params

    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create conversation with yourself'
      })
    }

    // Ensure user1Id is always the smaller ID for consistency
    const [user1Id, user2Id] = [userId, otherUserId].sort()

    // Try to find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { OR: [{ user1Id }, { user2Id }] },
          { OR: [{ user1Id: otherUserId }, { user2Id: otherUserId }] }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true
          }
        }
      }
    })

    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isActive: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isActive: true
            }
          },
          messages: true
        }
      })
    }

    // Get the other user's info
    const otherUser = conversation.user1Id === userId 
      ? conversation.user2 
      : conversation.user1

    const onlineUsers = req.app?.locals?.onlineUsers
    const isOnline = onlineUsers?.has?.(otherUser.id) ?? false
    const otherUserWithPresence = {
      ...otherUser,
      isOnline
    }

    // Get unread count for current user
    const unreadCount = conversation.user1Id === userId
      ? conversation.user1UnreadCount
      : conversation.user2UnreadCount

    res.json({
      success: true,
      data: {
        ...conversation,
        otherUser: otherUserWithPresence,
        unreadCount
      }
    })
  } catch (error) {
    // Error getting/creating conversation
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    })
  }
}

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Format conversations with other user info and unread count
    const onlineUsers = req.app?.locals?.onlineUsers

    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const isOnline = onlineUsers?.has?.(otherUser.id) ?? false
      const unreadCount = conv.user1Id === userId 
        ? conv.user1UnreadCount 
        : conv.user2UnreadCount
      const lastMessage = conv.messages[0] || null

      return {
        id: conv.id,
        otherUser: {
          ...otherUser,
          isOnline
        },
        lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }
    })

    res.json({
      success: true,
      data: formattedConversations
    })
  } catch (error) {
    // Error getting conversations
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    })
  }
}

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }

    const skip = (page - 1) * limit

    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.message.count({
        where: {
          conversationId
        }
      })
    ])

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      }
    })
  } catch (error) {
    // Error getting messages
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    })
  }
}

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params
    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      })
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }

    // Determine recipient
    const recipientId = conversation.user1Id === userId 
      ? conversation.user2Id 
      : conversation.user1Id

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          recipientId,
          content: content.trim()
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: content.trim().substring(0, 100),
          ...(conversation.user1Id === userId
            ? { user2UnreadCount: { increment: 1 } }
            : { user1UnreadCount: { increment: 1 } })
        }
      })
    ])

    res.status(201).json({
      success: true,
      data: message
    })
  } catch (error) {
    // Error sending message
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    })
  }
}

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }

    // Mark all unread messages as read and reset unread count
    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: conversation.user1Id === userId
          ? { user1UnreadCount: 0 }
          : { user2UnreadCount: 0 }
      })
    ])

    res.json({
      success: true,
      message: 'Messages marked as read'
    })
  } catch (error) {
    // Error marking messages as read
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    })
  }
}

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }

    // Delete conversation (messages will cascade delete)
    await prisma.conversation.delete({
      where: { id: conversationId }
    })

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    // Error deleting conversation
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    })
  }
}

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      select: {
        user1Id: true,
        user1UnreadCount: true,
        user2UnreadCount: true
      }
    })

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.user1Id === userId 
        ? conv.user1UnreadCount 
        : conv.user2UnreadCount)
    }, 0)

    res.json({
      success: true,
      data: { unreadCount: totalUnread }
    })
  } catch (error) {
    // Error getting unread count
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    })
  }
}
