import api from '@/lib/api'

// Toggle like on a post (like/unlike)
export const toggleLike = async (postId) => {
  const response = await api.post(`/likes/posts/${postId}`)
  return response.data.data // Extract data from { success, data } structure
}

// Get likes for a post
export const getPostLikes = async (postId, page = 1, limit = 20) => {
  const response = await api.get(`/likes/posts/${postId}`, {
    params: { page, limit },
  })
  return response.data.data // Extract data from { success, data } structure
}

// Check if current user liked a post
export const checkUserLiked = async (postId) => {
  const response = await api.get(`/likes/posts/${postId}/check`)
  return response.data.data // Extract data from { success, data } structure
}

// Get posts liked by a user
export const getUserLikedPosts = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/likes/user/${userId}/liked`, {
    params: { page, limit },
  })
  return response.data // Extract { success, data, pagination } structure
}

export default {
  toggleLike,
  getPostLikes,
  checkUserLiked,
  getUserLikedPosts,
}
