import { PrismaClient } from "@prisma/client";
import { createNotification } from "../NotifFeature/notificationController.js";

const prisma = new PrismaClient();
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { shareCaption, audience } = req.body;
    const userId = req.user.id;
    const validAudiences = ["Public", "Following", "OnlyMe"];
    const shareAudience = validAudiences.includes(audience)
      ? audience
      : "Public";
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
    });

    if (!targetPost) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }
    if (targetPost.userId !== userId) {
      if (targetPost.audience === "OnlyMe") {
        return res.status(403).json({
          success: false,
          error: "This post is private and cannot be shared",
        });
      }
      if (targetPost.audience === "Following") {
        const postAuthorFollowsMe = await prisma.follower.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetPost.userId,
              followingId: userId,
            },
          },
        });

        if (!postAuthorFollowsMe) {
          return res.status(403).json({
            success: false,
            error: "This post is only visible to people the author follows",
          });
        }
      }
    }
    const existingShare = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingShare) {
      return res.status(400).json({
        success: false,
        error: "You already shared this post",
      });
    }
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
    });
    if (targetPost.userId !== userId) {
      await createNotification({
        type: "share",
        senderId: userId,
        recipientId: targetPost.userId,
        postId,
        content: "shared your post",
      });
    }
    const shareCount = await prisma.share.count({
      where: { postId },
    });
    const io = req.app.get("io");
    if (io && targetPost.userId !== userId) {
      io.to(targetPost.userId).emit("new-share", {
        share,
        shareCount,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        share,
        shareCount,
      },
      message: "Post shared successfully",
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to share post",
    });
  }
};
export const unsharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const share = await prisma.share.findFirst({
      where: {
        postId,
        userId,
      },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: "Share not found",
      });
    }
    await prisma.share.delete({
      where: {
        id: share.id,
      },
    });
    const shareCount = await prisma.share.count({
      where: { postId },
    });

    return res.status(200).json({
      success: true,
      data: {
        shareCount,
      },
      message: "Post unshared successfully",
    });
  } catch (error) {
    console.error("Error unsharing post:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to unshare post",
    });
  }
};
export const getPostShares = async (req, res) => {
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
    const shares = await prisma.share.findMany({
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
    const sharesWithFollowStatus = await Promise.all(
      shares.map(async (share) => {
        const isFollowing =
          currentUserId && currentUserId !== share.user.id
            ? await prisma.follower.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: currentUserId,
                    followingId: share.user.id,
                  },
                },
              })
            : null;

        return {
          ...share,
          user: {
            ...share.user,
            isFollowing: !!isFollowing,
          },
        };
      })
    );
    const totalShares = await prisma.share.count({
      where: { postId },
    });

    return res.status(200).json({
      success: true,
      data: {
        shares: sharesWithFollowStatus,
        totalShares,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShares / parseInt(limit)),
        hasMore: skip + shares.length < totalShares,
      },
    });
  } catch (error) {
    console.error("Error getting post shares:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get post shares",
    });
  }
};
export const checkUserShared = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const share = await prisma.share.findFirst({
      where: {
        postId,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        shared: !!share,
      },
    });
  } catch (error) {
    console.error("Error checking user share:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check share status",
    });
  }
};
export const updateShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { shareCaption, audience } = req.body;
    const userId = req.user.id;
    const validAudiences = ["Public", "Following", "OnlyMe"];
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: "Share not found",
      });
    }
    if (share.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to update this share",
      });
    }
    const updateData = {
      shareCaption:
        shareCaption !== undefined ? shareCaption || null : share.shareCaption,
      updatedAt: new Date(),
    };
    if (audience && validAudiences.includes(audience)) {
      updateData.audience = audience;
    }
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
    });

    return res.status(200).json({
      success: true,
      data: updatedShare,
      message: "Share updated successfully",
    });
  } catch (error) {
    console.error("Error updating share:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update share",
    });
  }
};
export const getUserShares = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const followers = await prisma.follower.findMany({
      where: { followingId: currentUserId },
      select: { followerId: true },
    });
    const followerIds = followers.map((f) => f.followerId);
    const shares = await prisma.share.findMany({
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
    });
    const filteredShares = shares.filter((share) => {
      const post = share.post;
      if (!post) return false;
      if (post.userId === currentUserId) return true;
      if (post.audience === "Public") return true;
      if (post.audience === "OnlyMe") return post.userId === currentUserId;
      if (post.audience === "Following") {
        return followerIds.includes(post.userId);
      }

      return false;
    });
    const formattedShares = filteredShares.map((share) => ({
      ...share,
      userReaction: share.reactions[0]?.reactionType || null,
      reactions: undefined, // Remove reactions array
      post: share.post
        ? {
            ...share.post,
            userReaction: share.post.reactions[0]?.reactionType || null,
            reactions: undefined, // Remove post reactions array
          }
        : share.post,
    }));
    const totalShares = filteredShares.length;

    return res.status(200).json({
      success: true,
      data: formattedShares,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShares / parseInt(limit)),
        total: totalShares,
        hasMore: skip + shares.length < totalShares,
      },
    });
  } catch (error) {
    console.error("Error getting user shares:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get user shares",
    });
  }
};

