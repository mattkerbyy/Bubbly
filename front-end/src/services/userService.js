import api from '@/lib/api'

/**
 * Get user profile by username
 */
export const getUserProfile = async (username) => {
  const response = await api.get(`/users/${username}`)
  return response.data
}

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData)
  return response.data
}

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await api.put('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Upload user cover photo
 */
export const uploadCover = async (file) => {
  const formData = new FormData()
  formData.append('cover', file)

  const response = await api.put('/users/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Delete user avatar
 */
export const deleteAvatar = async () => {
  const response = await api.delete('/users/avatar')
  return response.data
}

/**
 * Delete user cover photo
 */
export const deleteCover = async () => {
  const response = await api.delete('/users/cover')
  return response.data
}

/**
 * Get user posts
 */
export const getUserPosts = async (username, page = 1, limit = 10) => {
  const response = await api.get(`/users/${username}/posts`, {
    params: { page, limit },
  })
  return response.data
}

/**
 * Search users
 */
export const searchUsers = async (query, limit = 10) => {
  const response = await api.get('/users/search', {
    params: { q: query, limit },
  })
  return response.data
}
