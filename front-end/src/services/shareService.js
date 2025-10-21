import api from '@/lib/api'

// Share a post
export const sharePost = async (postId, shareCaption = null, audience = 'Public') => {
  const response = await api.post(`/shares/post/${postId}`, { shareCaption, audience })
  return response.data.data // Extract data from { success, data } structure
}

// Update share caption and audience
export const updateShare = async (shareId, shareCaption, audience) => {
  const response = await api.put(`/shares/${shareId}`, { shareCaption, audience })
  return response.data.data // Extract data from { success, data } structure
}

// Unshare a post
export const unsharePost = async (postId) => {
  const response = await api.delete(`/shares/${postId}`)
  return response.data.data // Extract data from { success, data } structure
}

// Get shares for a post
export const getPostShares = async (postId, page = 1, limit = 20) => {
  const response = await api.get(`/shares/${postId}`, {
    params: { page, limit },
  })
  return response.data.data // Extract data from { success, data } structure
}

// Check if current user shared a post
export const checkUserShared = async (postId) => {
  const response = await api.get(`/shares/${postId}/check`)
  return response.data.data // Extract data from { success, data } structure
}

// Get posts shared by a user
export const getUserShares = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/shares/user/${userId}`, {
    params: { page, limit },
  })
  return response.data // Extract { success, data, pagination } structure
}

export default {
  sharePost,
  updateShare,
  unsharePost,
  getPostShares,
  checkUserShared,
  getUserShares,
}
