import { PrismaClient } from "@prisma/client";
import { createNotification } from "../NotifFeature/notificationController.js";

const prisma = new PrismaClient();

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required",
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Comment content must be 500 characters or less",
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        userId,
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
    });

    await createNotification({
      type: "comment",
      senderId: userId,
      recipientId: post.userId,
      postId,
      content: "commented on your post",
    });

    return res.status(201).json({
      success: true,
      data: comment,
      message: "Comment created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to create comment",
    });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: "desc",
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
    });

    const totalComments = await prisma.comment.count({
      where: { postId },
    });

    return res.status(200).json({
      success: true,
      data: {
        comments,
        totalComments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / parseInt(limit)),
        hasMore: skip + comments.length < totalComments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to get comments",
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required",
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Comment content must be 500 characters or less",
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own comments",
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
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
    });

    return res.status(200).json({
      success: true,
      data: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to update comment",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      });
    }

    if (comment.userId !== userId && comment.post.userId !== userId) {
      return res.status(403).json({
        success: false,
        error:
          "You can only delete your own comments or comments on your posts",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to delete comment",
    });
  }
};
