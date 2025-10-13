import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content } = req.body
    const userId = req.user.id

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post content is required'
      })
    }

    // Get image path if uploaded
    const image = req.file ? `/uploads/posts/${req.file.filename}` : null

    // Create post
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        image,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    })
  }
}

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Private
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const userId = req.user.id

    // Get posts with user info and counts
    const posts = await prisma.post.findMany({
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: {
            userId
          },
          select: {
            id: true
          }
        }
      }
    })

    // Add isLiked field to each post
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined // Remove the likes array from response
    }))

    // Get total count for pagination
    const totalPosts = await prisma.post.count()

    res.status(200).json({
      success: true,
      data: postsWithLikeStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    })
  }
}

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        comments: {
          include: {
            user: {
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
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    res.status(200).json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    })
  }
}

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (own posts only)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user.id

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      })
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    res.status(200).json({
      success: true,
      data: updatedPost
    })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    })
  }
}

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (own posts only)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      })
    }

    // Delete post (cascade will handle likes and comments)
    await prisma.post.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    })
  }
}

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Private
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const posts = await prisma.post.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    const totalPosts = await prisma.post.count({
      where: { userId }
    })

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user posts'
    })
  }
}
