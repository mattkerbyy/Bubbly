import api from '@/lib/api'

export const postService = {
  // Get all posts with pagination
  getPosts: async ({ page = 1, limit = 10 }) => {
    const { data } = await api.get(`/posts?page=${page}&limit=${limit}`)
    return data
  },

  // Get single post by ID
  getPostById: async (postId) => {
    const { data } = await api.get(`/posts/${postId}`)
    return data
  },

  // Get posts by specific user
  getUserPosts: async (userId, { page = 1, limit = 10 }) => {
    const { data } = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`)
    return data
  },

  // Create new post
  createPost: async (postData) => {
    // If postData is already FormData, use it directly
    if (postData instanceof FormData) {
      const { data } = await api.post('/posts', postData)
      return data
    }
    
    // Otherwise, create FormData from object (for backward compatibility)
    const formData = new FormData()
    formData.append('content', postData.content)
    
    if (postData.image) {
      formData.append('image', postData.image)
    }

    // Let the browser set the Content-Type (including boundary) when sending FormData.
    // Setting Content-Type manually can remove the boundary and cause Multer to fail parsing the file.
    const { data } = await api.post('/posts', formData)
    return data
  },

  // Update post
  updatePost: async (postId, postData) => {
    const { data } = await api.put(`/posts/${postId}`, postData)
    return data
  },

  // Delete post
  deletePost: async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`)
    return data
  },

  // Delete share (unshare)
  deleteShare: async (postId) => {
    const { data } = await api.delete(`/shares/${postId}`)
    return data
  }
}
