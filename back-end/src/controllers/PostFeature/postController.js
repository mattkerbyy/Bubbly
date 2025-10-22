import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createPost = async (req, res) => {
  try {
    const { content, audience } = req.body;
    const userId = req.user.id;

    if ((!content || content.trim().length === 0) && !req.files && !req.file) {
      return res.status(400).json({
        success: false,
        error: "Post must have content or at least one file",
      });
    }

    const validAudiences = ["Public", "Following", "OnlyMe"];
    const postAudience = validAudiences.includes(audience)
      ? audience
      : "Public";

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map(
        (file) => `/uploads/posts/${file.filename}`
      );
    } else if (req.file) {
      uploadedFiles = [`/uploads/posts/${req.file.filename}`];
    }

    const file = uploadedFiles.length > 0 ? uploadedFiles[0] : null;

    const post = await prisma.post.create({
      data: {
        content: content?.trim() || null,
        file,
        files: uploadedFiles,
        audience: postAudience,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create post",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    const followerIds = followers.map((f) => f.followerId);

    const allPosts = await prisma.post.findMany({
      take: parseInt(limit) * 3,
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
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
        reactions: {
          where: {
            userId,
          },
          select: {
            id: true,
            reactionType: true,
          },
        },
      },
    });

    const allShares = await prisma.share.findMany({
      take: parseInt(limit) * 2,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        OR: [
          { userId: userId },
          { userId: { in: followingIds } },
        ],
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
              where: {
                userId,
              },
              select: {
                id: true,
                reactionType: true,
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
        reactions: {
          where: {
            userId,
          },
          select: {
            id: true,
            reactionType: true,
          },
        },
      },
    });

    const filteredPosts = allPosts.filter((post) => {
      if (post.userId === userId) return true;
      if (post.audience === "Public") return true;
      if (post.audience === "OnlyMe") return false;
      if (post.audience === "Following") {
        return followerIds.includes(post.userId);
      }
      return false;
    });

    const filteredShares = allShares.filter((share) => {
      if (share.userId === userId) return true;

      if (share.audience === "Public") {
        const post = share.post;
        if (!post) return false;

        if (post.userId === userId) return true;
        if (post.audience === "Public") return true;
        if (post.audience === "OnlyMe") return post.userId === userId;
        if (post.audience === "Following") {
          return followerIds.includes(post.userId);
        }
        return false;
      }

      if (share.audience === "OnlyMe") return false;

      if (share.audience === "Following") {
        if (!followerIds.includes(share.userId)) return false;

        const post = share.post;
        if (!post) return false;

        if (post.userId === userId) return true;
        if (post.audience === "Public") return true;
        if (post.audience === "OnlyMe") return post.userId === userId;
        if (post.audience === "Following") {
          return followerIds.includes(post.userId);
        }
        return false;
      }

      return false;
    });

    const feedItems = [
      ...filteredPosts.map((post) => ({
        type: "post",
        data: post,
        createdAt: post.createdAt,
      })),
      ...filteredShares.map((share) => ({
        type: "share",
        data: share,
        createdAt: share.createdAt,
      })),
    ];

    const sortedFeedItems = feedItems.sort((a, b) => {
      const aUserId = a.type === "post" ? a.data.userId : a.data.userId;
      const bUserId = b.type === "post" ? b.data.userId : b.data.userId;

      const aIsFollowed = followingIds.includes(aUserId) || aUserId === userId;
      const bIsFollowed = followingIds.includes(bUserId) || bUserId === userId;

      if (aIsFollowed === bIsFollowed) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return aIsFollowed ? -1 : 1;
    });

    const paginatedFeedItems = sortedFeedItems.slice(
      skip,
      skip + parseInt(limit)
    );

    const processedFeedItems = paginatedFeedItems.map((item) => {
      if (item.type === "post") {
        return {
          type: "post",
          ...item.data,
          userReaction: item.data.reactions[0]?.reactionType || null,
          reactions: undefined,
        };
      } else {
        return {
          type: "share",
          ...item.data,
          userReaction: item.data.reactions[0]?.reactionType || null,
          reactions: undefined,
          post: item.data.post
            ? {
                ...item.data.post,
                userReaction:
                  item.data.post.reactions?.[0]?.reactionType || null,
                reactions: undefined,
              }
            : null,
        };
      }
    });

    const totalPosts = await prisma.post.count();
    const totalShares = await prisma.share.count({
      where: {
        OR: [{ userId: userId }, { userId: { in: followingIds } }],
      },
    });
    const totalItems = totalPosts + totalShares;

    res.status(200).json({
      success: true,
      data: processedFeedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalPosts,
        totalShares,
        hasMore: skip + paginatedFeedItems.length < totalItems,
      },
    });
  } catch (error) {
    console.error("Get posts failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch posts",
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
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
          orderBy: {
            createdAt: "desc",
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
          where: {
            userId,
          },
          select: {
            id: true,
            reactionType: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    if (post.userId !== userId) {
      if (post.audience === "OnlyMe") {
        return res.status(403).json({
          success: false,
          error: "This post is private",
        });
      }

      if (post.audience === "Following") {
        const postAuthorFollowsMe = await prisma.follower.findUnique({
          where: {
            followerId_followingId: {
              followerId: post.userId,
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

    const postWithReactionStatus = {
      ...post,
      userReaction: post.reactions[0]?.reactionType || null,
      reactions: undefined,
    };

    res.status(200).json({
      success: true,
      data: postWithReactionStatus,
    });
  } catch (error) {
    console.error("Get post failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch post",
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, removeFiles, keepFiles, audience } = req.body;
    const userId = req.user.id;

    let newFiles = [];
    if (req.files && req.files.length > 0) {
      newFiles = req.files.map((file) => `/uploads/posts/${file.filename}`);
    } else if (req.file) {
      newFiles = [`/uploads/posts/${req.file.filename}`];
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this post",
      });
    }

    const updateData = {};

    if (content !== undefined) {
      updateData.content = content.trim() || null;
    }

    if (audience && ["Public", "OnlyMe", "Following"].includes(audience)) {
      updateData.audience = audience;
    }

    if (removeFiles === "true") {
      updateData.files = [];
      updateData.file = null;
    } else if (newFiles.length > 0 || keepFiles) {
      let keptFiles = [];
      if (keepFiles) {
        try {
          keptFiles = JSON.parse(keepFiles);
        } catch (e) {}
      }

      const allFiles = [...keptFiles, ...newFiles];
      updateData.files = allFiles;
      updateData.file = allFiles[0] || null;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
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
          where: {
            userId,
          },
          select: {
            id: true,
            reactionType: true,
          },
        },
      },
    });

    const postWithReactionStatus = {
      ...updatedPost,
      userReaction: updatedPost.reactions[0]?.reactionType || null,
      reactions: undefined,
    };

    res.status(200).json({
      success: true,
      data: postWithReactionStatus,
    });
  } catch (error) {
    console.error("Update post failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update post",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this post",
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete post",
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await prisma.post.findMany({
      where: { userId },
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
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    const totalPosts = await prisma.post.count({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user posts",
    });
  }
};
