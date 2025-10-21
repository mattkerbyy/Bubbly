import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content, audience } = req.body
    const userId = req.user.id

    // Validate: must have either content or files
    if ((!content || content.trim().length === 0) && !req.files && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Post must have content or at least one file'
      })
    }

    // Validate audience type
    const validAudiences = ['Public', 'Following', 'OnlyMe']
    const postAudience = validAudiences.includes(audience) ? audience : 'Public'

    // Get file paths if uploaded (support both single and multiple files)
    let uploadedFiles = []
    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map(file => `/uploads/posts/${file.filename}`)
    } else if (req.file) {
      uploadedFiles = [`/uploads/posts/${req.file.filename}`]
    }

    // Store all files in files array, and first one in file field (backward compatibility)
    const file = uploadedFiles.length > 0 ? uploadedFiles[0] : null

    // Create post with specified audience
    const post = await prisma.post.create({
      data: {
        content: content?.trim() || null,
        file,
        files: uploadedFiles, // Store all files in array
        audience: postAudience,
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
            reactions: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: post
    })
  } catch (error) {
    // Create post failed
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

    // Get list of users who follow the current user (for "Following" audience posts)
    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    })
    const followerIds = followers.map((f) => f.followerId)

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
    })

    // Get shares from followed users and self
    const allShares = await prisma.share.findMany({
      take: parseInt(limit) * 2, // Include shares in feed
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        OR: [
          { userId: userId }, // Own shares
          { userId: { in: followingIds } }, // Shares from followed users
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
    })

    // Filter posts based on audience settings
    const filteredPosts = allPosts.filter((post) => {
      // Own posts are always visible
      if (post.userId === userId) return true
      
      // Public posts are visible to everyone
      if (post.audience === 'Public') return true
      
      // OnlyMe posts are only visible to the author
      if (post.audience === 'OnlyMe') return false
      
      // Following posts: visible only if the post author follows the current user
      // Meaning: "I share this with people I follow"
      if (post.audience === 'Following') {
        // Check if the post author follows the current user
        return followerIds.includes(post.userId)
      }
      
      return false
    })
    // Filter shares to only include posts and shares the user can see
    const filteredShares = allShares.filter((share) => {
      // First check the share's own audience setting
      // Own shares are always visible
      if (share.userId === userId) return true
      
      // Share audience: Public - visible to everyone
      if (share.audience === 'Public') {
        // But still need to check if user can see the embedded post
        const post = share.post
        if (!post) return false
        
        if (post.userId === userId) return true
        if (post.audience === 'Public') return true
        if (post.audience === 'OnlyMe') return post.userId === userId
        if (post.audience === 'Following') {
          return followerIds.includes(post.userId)
        }
        return false
      }
      
      // Share audience: OnlyMe - only visible to the share author
      if (share.audience === 'OnlyMe') return false
      
      // Share audience: Following - only visible if share author follows current user
      if (share.audience === 'Following') {
        if (!followerIds.includes(share.userId)) return false
        
        // Also check if user can see the embedded post
        const post = share.post
        if (!post) return false
        
        if (post.userId === userId) return true
        if (post.audience === 'Public') return true
        if (post.audience === 'OnlyMe') return post.userId === userId
        if (post.audience === 'Following') {
          return followerIds.includes(post.userId)
        }
        return false
      }
      
      return false
    })

    // Combine posts and shares with a type indicator
    const feedItems = [
      ...filteredPosts.map(post => ({ type: 'post', data: post, createdAt: post.createdAt })),
      ...filteredShares.map(share => ({ type: 'share', data: share, createdAt: share.createdAt }))
    ]

    // Sort combined feed by date, with priority for followed users
    const sortedFeedItems = feedItems.sort((a, b) => {
      // Determine if from followed user
      const aUserId = a.type === 'post' ? a.data.userId : a.data.userId
      const bUserId = b.type === 'post' ? b.data.userId : b.data.userId
      
      const aIsFollowed = followingIds.includes(aUserId) || aUserId === userId
      const bIsFollowed = followingIds.includes(bUserId) || bUserId === userId

      // If both are followed or both are not followed, sort by date
      if (aIsFollowed === bIsFollowed) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }

      // Followed items come first
      return aIsFollowed ? -1 : 1
    })

    // Apply pagination after sorting
    const paginatedFeedItems = sortedFeedItems.slice(skip, skip + parseInt(limit))

    // Process feed items for response
    const processedFeedItems = paginatedFeedItems.map((item) => {
      if (item.type === 'post') {
        return {
          type: 'post',
          ...item.data,
          userReaction: item.data.reactions[0]?.reactionType || null,
          reactions: undefined, // Remove the reactions array from response
        }
      } else {
        // Share item - include all share data with nested content
        return {
          type: 'share',
          ...item.data,
          userReaction: item.data.reactions[0]?.reactionType || null,
          reactions: undefined, // Remove share's reactions array from response
          post: item.data.post ? {
            ...item.data.post,
            userReaction: item.data.post.reactions?.[0]?.reactionType || null,
            reactions: undefined, // Remove post reactions array
          } : null,
        }
      }
    })

    // Get total count for pagination
    const totalPosts = await prisma.post.count()
    const totalShares = await prisma.share.count({
      where: {
        OR: [
          { userId: userId },
          { userId: { in: followingIds } },
        ],
      },
    })
    const totalItems = totalPosts + totalShares

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
    })
  } catch (error) {
    console.error('Get posts failed:', error)
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
            reactions: true,
            comments: true,
            shares: true
          }
        },
        reactions: {
          where: {
            userId
          },
          select: {
            id: true,
            reactionType: true
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

    // Check audience permissions
    if (post.userId !== userId) {
      if (post.audience === 'OnlyMe') {
        return res.status(403).json({
          success: false,
          error: 'This post is private'
        })
      }
      
      if (post.audience === 'Following') {
        // Check if the post author follows the current user
        const postAuthorFollowsMe = await prisma.follower.findUnique({
          where: {
            followerId_followingId: {
              followerId: post.userId,
              followingId: userId,
            },
          },
        })
        
        if (!postAuthorFollowsMe) {
          return res.status(403).json({
            success: false,
            error: 'This post is only visible to people the author follows'
          })
        }
      }
    }

    // Add userReaction field
    const postWithReactionStatus = {
      ...post,
      userReaction: post.reactions[0]?.reactionType || null,
      reactions: undefined // Remove the reactions array from response
    }

    res.status(200).json({
      success: true,
      data: postWithReactionStatus
    })
  } catch (error) {
    console.error('Get post failed:', error)
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
    const { content, removeFiles, keepFiles, audience } = req.body
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
    
    // Update audience if provided
    if (audience && ['Public', 'OnlyMe', 'Following'].includes(audience)) {
      updateData.audience = audience
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
            // Error parsing keepFiles
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
            reactions: true,
            comments: true,
            shares: true
          }
        },
        reactions: {
          where: {
            userId
          },
          select: {
            id: true,
            reactionType: true
          }
        }
      }
    })

    // Add userReaction field
    const postWithReactionStatus = {
      ...updatedPost,
      userReaction: updatedPost.reactions[0]?.reactionType || null,
      reactions: undefined
    }

    res.status(200).json({
      success: true,
      data: postWithReactionStatus
    })
  } catch (error) {
    console.error('Update post failed:', error)
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
    // Delete post failed
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
            reactions: true,
            comments: true,
            shares: true
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
    // Get user posts failed
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user posts'
    })
  }
}
