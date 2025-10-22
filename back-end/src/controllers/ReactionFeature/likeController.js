import { PrismaClient } from "@prisma/client";
import { createNotification } from "../NotifFeature/notificationController.js";

const prisma = new PrismaClient();
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      const likeCount = await prisma.like.count({
        where: { postId },
      });

      return res.status(200).json({
        success: true,
        data: {
          liked: false,
          likeCount,
        },
        message: "Post unliked successfully",
      });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      await createNotification({
        type: "like",
        senderId: userId,
        recipientId: post.userId,
        postId,
        content: "liked your post",
      });
      const likeCount = await prisma.like.count({
        where: { postId },
      });

      return res.status(200).json({
        success: true,
        data: {
          liked: true,
          likeCount,
        },
        message: "Post liked successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to toggle like",
    });
  }
};
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?.id;

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
    const likes = await prisma.like.findMany({
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
    const likesWithFollowStatus = await Promise.all(
      likes.map(async (like) => {
        const isFollowing = currentUserId
          ? await prisma.follower.findUnique({
              where: {
                followerId_followingId: {
                  followerId: currentUserId,
                  followingId: like.user.id,
                },
              },
            })
          : null;

        return {
          ...like,
          user: {
            ...like.user,
            isFollowing: !!isFollowing,
          },
        };
      })
    );
    const totalLikes = await prisma.like.count({
      where: { postId },
    });

    return res.status(200).json({
      success: true,
      data: {
        likes: likesWithFollowStatus,
        totalLikes,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLikes / parseInt(limit)),
        hasMore: skip + likes.length < totalLikes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to get post likes",
    });
  }
};
export const checkUserLiked = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        liked: !!like,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to check like status",
    });
  }
};
export const getUserLikedPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const likedPosts = await prisma.like.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: "desc",
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
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId: currentUserId },
              select: { id: true },
            },
          },
        },
      },
    });
    const posts = likedPosts.map((like) => ({
      ...like.post,
      isLiked: like.post.likes.length > 0,
      likes: undefined, // Remove the likes array used for checking
    }));
    const totalLikes = await prisma.like.count({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLikes / parseInt(limit)),
        total: totalLikes,
        hasMore: skip + likedPosts.length < totalLikes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to get liked posts",
    });
  }
};

