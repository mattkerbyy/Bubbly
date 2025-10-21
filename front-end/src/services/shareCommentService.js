import api from '../lib/api'

// Create a comment on a share
export const createShareComment = async (shareId, content) => {
  const response = await api.post(`/share-comments/${shareId}/comments`, {
    content,
  })
  return response.data
}

// Get comments for a share (with pagination)
export const getShareComments = async (shareId, cursor = null, limit = 20) => {
  const params = { limit }
  if (cursor) {
    params.cursor = cursor
  }
  const response = await api.get(`/share-comments/${shareId}/comments`, { params })
  return response.data
}

// Update a comment on a share
export const updateShareComment = async (commentId, content) => {
  const response = await api.put(`/share-comments/comments/${commentId}`, {
    content,
  })
  return response.data
}

// Delete a comment from a share
export const deleteShareComment = async (commentId) => {
  const response = await api.delete(`/share-comments/comments/${commentId}`)
  return response.data
}
