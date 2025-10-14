import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Search for users by name or username
 * GET /api/search/users?q=query&page=1&limit=10
 */
export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query
    const currentUserId = req.user.id

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    const searchQuery = q.trim()
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Search users by name or username (case-insensitive)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              id: { not: currentUserId }, // Exclude current user
            },
            {
              isActive: true, // Only active users
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { username: { contains: searchQuery, mode: 'insensitive' } },
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
          { verified: 'desc' }, // Verified users first
          { createdAt: 'desc' },
        ],
      }),
      prisma.user.count({
        where: {
          AND: [
            {
              id: { not: currentUserId },
            },
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { username: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    ])

    // Check if current user is following each user
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await prisma.follower.findFirst({
          where: {
            followerId: currentUserId,
            followingId: user.id,
          },
        })

        return {
          ...user,
          isFollowing: !!isFollowing,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
        }
      })
    )

    // Remove _count from response
    const formattedUsers = usersWithFollowStatus.map(({ _count, ...user }) => user)

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasMore: skip + formattedUsers.length < total,
      },
    })
  } catch (error) {
    console.error('Error searching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    })
  }
}

/**
 * Search for posts by content
 * GET /api/search/posts?q=query&page=1&limit=10
 */
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query
    const currentUserId = req.user.id

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    const searchQuery = q.trim()
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Search posts by content (case-insensitive)
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
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
              likes: true,
              comments: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.count({
        where: {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      }),
    ])

    // Check if current user liked each post
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const like = await prisma.like.findFirst({
          where: {
            postId: post.id,
            userId: currentUserId,
          },
        })

        return {
          ...post,
          isLiked: !!like,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        }
      })
    )

    // Remove _count from response
    const formattedPosts = postsWithLikeStatus.map(({ _count, ...post }) => post)

    res.json({
      success: true,
      data: formattedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasMore: skip + formattedPosts.length < total,
      },
    })
  } catch (error) {
    console.error('Error searching posts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search posts',
    })
  }
}

/**
 * Search for both users and posts
 * GET /api/search/all?q=query&page=1&limit=10
 */
export const searchAll = async (req, res) => {
  try {
    const { q, page = 1, limit = 5 } = req.query
    const currentUserId = req.user.id

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    const searchQuery = q.trim()

    // Search both users and posts (limited results for overview)
    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              id: { not: currentUserId },
            },
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { username: { contains: searchQuery, mode: 'insensitive' } },
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
        orderBy: [
          { verified: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.post.findMany({
        where: {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
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
              likes: true,
              comments: true,
            },
          },
        },
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    // Get total counts
    const [totalUsers, totalPosts] = await Promise.all([
      prisma.user.count({
        where: {
          AND: [
            {
              id: { not: currentUserId },
            },
            {
              isActive: true,
            },
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { username: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
      prisma.post.count({
        where: {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      }),
    ])

    // Add follow status to users
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await prisma.follower.findFirst({
          where: {
            followerId: currentUserId,
            followingId: user.id,
          },
        })

        return {
          ...user,
          isFollowing: !!isFollowing,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
        }
      })
    )

    // Add like status to posts
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const like = await prisma.like.findFirst({
          where: {
            postId: post.id,
            userId: currentUserId,
          },
        })

        return {
          ...post,
          isLiked: !!like,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        }
      })
    )

    // Remove _count from responses
    const formattedUsers = usersWithFollowStatus.map(({ _count, ...user }) => user)
    const formattedPosts = postsWithLikeStatus.map(({ _count, ...post }) => post)

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
    })
  } catch (error) {
    console.error('Error searching all:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search',
    })
  }
}
