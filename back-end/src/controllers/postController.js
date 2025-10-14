import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content } = req.body
    const userId = req.user.id

    // Validate: must have either content or files
    if ((!content || content.trim().length === 0) && !req.files && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Post must have content or at least one file'
      })
    }

    // Get file paths if uploaded (support both single and multiple files)
    let uploadedFiles = []
    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map(file => `/uploads/posts/${file.filename}`)
    } else if (req.file) {
      uploadedFiles = [`/uploads/posts/${req.file.filename}`]
    }

    // Store all files in files array, and first one in file field (backward compatibility)
    const file = uploadedFiles.length > 0 ? uploadedFiles[0] : null

    // Create post
    const post = await prisma.post.create({
      data: {
        content: content?.trim() || null,
        file,
        files: uploadedFiles, // Store all files in array
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

    // Get list of users that current user is following
    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    // Get posts from followed users first, then other posts
    // Fetch more posts than needed to ensure we have enough after sorting
    const allPosts = await prisma.post.findMany({
      take: parseInt(limit) * 3, // Fetch 3x to have buffer for sorting
      orderBy: {
        createdAt: 'desc',
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
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
      },
    })

    // Sort posts: followed users' posts first, then others
    const sortedPosts = allPosts.sort((a, b) => {
      const aIsFollowed = followingIds.includes(a.userId)
      const bIsFollowed = followingIds.includes(b.userId)

      // If both are followed or both are not followed, sort by date
      if (aIsFollowed === bIsFollowed) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }

      // Followed posts come first
      return aIsFollowed ? -1 : 1
    })

    // Apply pagination after sorting
    const paginatedPosts = sortedPosts.slice(skip, skip + parseInt(limit))

    // Add isLiked field to each post
    const postsWithLikeStatus = paginatedPosts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined, // Remove the likes array from response
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
        hasMore: skip + paginatedPosts.length < totalPosts,
      },
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
    })
  }
}

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

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
          }
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
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // Add isLiked field
    const postWithLikeStatus = {
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined // Remove the likes array from response
    }

    res.status(200).json({
      success: true,
      data: postWithLikeStatus
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
    const { content, removeFiles, keepFiles } = req.body
    const userId = req.user.id
    
    // Get file paths if uploaded (support both single and multiple files)
    let newFiles = []
    if (req.files && req.files.length > 0) {
      newFiles = req.files.map(file => `/uploads/posts/${file.filename}`)
    } else if (req.file) {
      newFiles = [`/uploads/posts/${req.file.filename}`]
    }

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

    // Prepare update data
    const updateData = {}
    
    if (content !== undefined) {
      updateData.content = content.trim() || null
    }
    
    // Handle files update/removal
    if (removeFiles === 'true') {
      // Remove all files
      updateData.files = []
      updateData.file = null
    } else if (newFiles.length > 0 || keepFiles) {
      // Merge kept files with new files
      let keptFiles = []
      if (keepFiles) {
        try {
          keptFiles = JSON.parse(keepFiles)
        } catch (e) {
          console.error('Error parsing keepFiles:', e)
        }
      }
      
      // Combine kept files and new files
      const allFiles = [...keptFiles, ...newFiles]
      updateData.files = allFiles
      updateData.file = allFiles[0] || null // First file for backward compatibility
    }
    // If neither new files nor remove flag, keep existing files

    // Update post
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
            verified: true
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

    // Add isLiked field
    const postWithLikeStatus = {
      ...updatedPost,
      isLiked: updatedPost.likes.length > 0,
      likes: undefined
    }

    res.status(200).json({
      success: true,
      data: postWithLikeStatus
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
