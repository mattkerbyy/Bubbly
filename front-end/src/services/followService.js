import api from '../lib/api'

/**
 * Follow a user
 * @param {string} userId - ID of user to follow
 */
export const followUser = async (userId) => {
  const response = await api.post(`/follow/${userId}`)
  return response.data
}

/**
 * Unfollow a user
 * @param {string} userId - ID of user to unfollow
 */
export const unfollowUser = async (userId) => {
  const response = await api.delete(`/follow/${userId}`)
  return response.data
}

/**
 * Get followers of a user
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Number of followers per page
 */
export const getFollowers = async (userId, page = 1, limit = 20) => {
  const response = await api.get(`/follow/${userId}/followers`, {
    params: { page, limit },
  })
  return response.data
}

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Number of following per page
 */
export const getFollowing = async (userId, page = 1, limit = 20) => {
  const response = await api.get(`/follow/${userId}/following`, {
    params: { page, limit },
  })
  return response.data
}

/**
 * Check if current user is following a user
 * @param {string} userId - User ID to check
 */
export const checkFollowStatus = async (userId) => {
  const response = await api.get(`/follow/${userId}/status`)
  return response.data
}

/**
 * Get suggested users to follow
 * @param {number} limit - Number of suggestions
 */
export const getSuggestedUsers = async (limit = 5) => {
  const response = await api.get('/follow/suggestions/users', {
    params: { limit },
  })
  return response.data
}
