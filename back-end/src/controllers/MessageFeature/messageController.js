import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        error: "Cannot create conversation with yourself",
      });
    }

    const [user1Id, user2Id] = [userId, otherUserId].sort();

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { OR: [{ user1Id }, { user2Id }] },
          { OR: [{ user1Id: otherUserId }, { user2Id: otherUserId }] },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isActive: true,
            },
          },
          user2: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isActive: true,
            },
          },
          messages: true,
        },
      });
    }

    const otherUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    const onlineUsers = req.app?.locals?.onlineUsers;
    const isOnline = onlineUsers?.has?.(otherUser.id) ?? false;
    const otherUserWithPresence = {
      ...otherUser,
      isOnline,
    };

    const unreadCount =
      conversation.user1Id === userId
        ? conversation.user1UnreadCount
        : conversation.user2UnreadCount;

    res.json({
      success: true,
      data: {
        ...conversation,
        otherUser: otherUserWithPresence,
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversation",
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isActive: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const onlineUsers = req.app?.locals?.onlineUsers;

    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const isOnline = onlineUsers?.has?.(otherUser.id) ?? false;
      const unreadCount =
        conv.user1Id === userId ? conv.user1UnreadCount : conv.user2UnreadCount;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        otherUser: {
          ...otherUser,
          isOnline,
        },
        lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversations",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          conversationId,
        },
      }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get messages",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message content is required",
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    const recipientId =
      conversation.user1Id === userId
        ? conversation.user2Id
        : conversation.user1Id;

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          recipientId,
          content: content.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: content.trim().substring(0, 100),
          ...(conversation.user1Id === userId
            ? { user2UnreadCount: { increment: 1 } }
            : { user1UnreadCount: { increment: 1 } }),
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data:
          conversation.user1Id === userId
            ? { user1UnreadCount: 0 }
            : { user2UnreadCount: 0 },
      }),
    ]);

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark messages as read",
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        user1Id: true,
        user1UnreadCount: true,
        user2UnreadCount: true,
      },
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      return (
        sum +
        (conv.user1Id === userId
          ? conv.user1UnreadCount
          : conv.user2UnreadCount)
      );
    }, 0);

    res.json({
      success: true,
      data: { unreadCount: totalUnread },
    });
  } catch (error) {
    // Error getting unread count
    res.status(500).json({
      success: false,
      error: "Failed to get unread count",
    });
  }
};
