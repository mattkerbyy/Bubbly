import api from '@/lib/api'

// Create a comment on a post
export const createComment = async (postId, content) => {
  const response = await api.post(`/comments/posts/${postId}`, { content })
  return response.data.data // Extract data from { success, data } structure
}

// Get comments for a post
export const getPostComments = async (postId, page = 1, limit = 10) => {
  const response = await api.get(`/comments/posts/${postId}`, {
    params: { page, limit },
  })
  return response.data.data // Extract data from { success, data } structure
}

// Update a comment
export const updateComment = async (commentId, content) => {
  const response = await api.put(`/comments/${commentId}`, { content })
  return response.data.data // Extract data from { success, data } structure
}

// Delete a comment
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`)
  return response.data // Keep full response for delete (no nested data)
}

export default {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
}
