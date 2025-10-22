import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Search for users by name or username (including @ mentions)
 * GET /api/search/users?q=query&page=1&limit=10
 */

export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    let searchQuery = q.trim();
    if (searchQuery.startsWith("@")) {
      searchQuery = searchQuery.substring(1);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              isActive: true, // Only active users
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { username: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          verified: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: [
          { verified: "desc" }, // Verified users first
          { createdAt: "desc" },
        ],
      }),
      prisma.user.count({
        where: {
          AND: [
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { username: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
          ],
        },
      }),
    ]);
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await prisma.follower.findFirst({
          where: {
            followerId: currentUserId,
            followingId: user.id,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
        };
      })
    );
    const formattedUsers = usersWithFollowStatus.map(
      ({ _count, ...user }) => user
    );

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasMore: skip + formattedUsers.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search users",
    });
  }
};

/**
 * Search for posts by content or hashtags
 * GET /api/search/posts?q=query&page=1&limit=10
 */
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    let searchQuery = q.trim();
    const isHashtagSearch = searchQuery.startsWith("#");

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          content: {
            contains: searchQuery,
            mode: "insensitive",
          },
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
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.post.count({
        where: {
          content: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      }),
    ]);
    const postsWithReactionStatus = await Promise.all(
      posts.map(async (post) => {
        const reaction = await prisma.reaction.findFirst({
          where: {
            postId: post.id,
            userId: currentUserId,
          },
        });

        return {
          ...post,
          userReaction: reaction?.reactionType || null,
          reactionsCount: post._count.reactions,
          commentsCount: post._count.comments,
          sharesCount: post._count.shares,
        };
      })
    );
    const formattedPosts = postsWithReactionStatus.map(
      ({ _count, ...post }) => post
    );

    res.json({
      success: true,
      data: formattedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasMore: skip + formattedPosts.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search posts",
    });
  }
};

/**
 * Search for both users and posts
 * GET /api/search/all?q=query&page=1&limit=10
 */
export const searchAll = async (req, res) => {
  try {
    const { q, page = 1, limit = 5 } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    let searchQuery = q.trim();
    if (searchQuery.startsWith("@")) {
      searchQuery = searchQuery.substring(1);
    }
    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { username: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          verified: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        take: parseInt(limit),
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      }),
      prisma.post.findMany({
        where: {
          content: {
            contains: searchQuery,
            mode: "insensitive",
          },
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
        },
        take: parseInt(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);
    const [totalUsers, totalPosts] = await Promise.all([
      prisma.user.count({
        where: {
          AND: [
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { username: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
          ],
        },
      }),
      prisma.post.count({
        where: {
          content: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      }),
    ]);
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await prisma.follower.findFirst({
          where: {
            followerId: currentUserId,
            followingId: user.id,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
        };
      })
    );
    const postsWithReactionStatus = await Promise.all(
      posts.map(async (post) => {
        const reaction = await prisma.reaction.findFirst({
          where: {
            postId: post.id,
            userId: currentUserId,
          },
        });

        return {
          ...post,
          userReaction: reaction?.reactionType || null,
          reactionsCount: post._count.reactions,
          commentsCount: post._count.comments,
          sharesCount: post._count.shares,
        };
      })
    );
    const formattedUsers = usersWithFollowStatus.map(
      ({ _count, ...user }) => user
    );
    const formattedPosts = postsWithReactionStatus.map(
      ({ _count, ...post }) => post
    );

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        posts: formattedPosts,
      },
      counts: {
        users: totalUsers,
        posts: totalPosts,
        total: totalUsers + totalPosts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search",
    });
  }
};

