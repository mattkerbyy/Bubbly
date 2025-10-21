import api from '@/lib/api'

// Valid reaction types
export const REACTION_TYPES = {
  LIKE: 'Like',
  HEART: 'Heart',
  LAUGHING: 'Laughing',
  WOW: 'Wow',
  SAD: 'Sad',
  ANGRY: 'Angry'
}

// Reaction emojis mapping
export const REACTION_EMOJIS = {
  LIKE: '👍',
  HEART: '❤️',
  LAUGHING: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
  // Also support PascalCase for compatibility
  Like: '👍',
  Heart: '❤️',
  Laughing: '😂',
  Wow: '😮',
  Sad: '😢',
  Angry: '😠'
}

// Add or update reaction on a post
export const addOrUpdateReaction = async (postId, reactionType) => {
  const response = await api.post(`/reactions/${postId}`, { reactionType })
  return response.data.data // Extract data from { success, data } structure
}

// Remove reaction from a post
export const removeReaction = async (postId) => {
  const response = await api.delete(`/reactions/${postId}`)
  return response.data.data // Extract data from { success, data } structure
}

// Get reactions for a post
export const getPostReactions = async (postId, page = 1, limit = 20, reactionType = null) => {
  const response = await api.get(`/reactions/${postId}`, {
    params: { page, limit, reactionType },
  })
  return response.data.data // Extract data from { success, data } structure
}

// Check current user's reaction on a post
export const checkUserReaction = async (postId) => {
  const response = await api.get(`/reactions/${postId}/check`)
  return response.data.data // Extract data from { success, data } structure
}

// Get posts reacted by a user
export const getUserReactedPosts = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/reactions/user/${userId}/posts`, {
    params: { page, limit },
  })
  return response.data // Extract { success, data, pagination } structure
}

export default {
  REACTION_TYPES,
  REACTION_EMOJIS,
  addOrUpdateReaction,
  removeReaction,
  getPostReactions,
  checkUserReaction,
  getUserReactedPosts,
}
