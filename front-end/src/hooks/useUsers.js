import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  getUserPosts,
  searchUsers,
} from '@/services/userService'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'

/**
 * Hook to get user profile by username
 */
export const useUserProfile = (username, options = {}) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data

      // Update auth store
      updateUser(updatedUser)

      // Update profile cache
      queryClient.setQueryData(['user', user.username], (old) => ({
        ...old,
        data: updatedUser,
      }))

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', user.username] })

      toast.success('Profile updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
      console.error('Update profile error:', error)
    },
  })
}

/**
 * Hook to upload avatar
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (response) => {
      const updatedUser = response.data

      // Update auth store
      updateUser(updatedUser)

      // Update profile cache
      queryClient.setQueryData(['user', user.username], (old) => ({
        ...old,
        data: updatedUser,
      }))

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', user.username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })

      toast.success('Avatar updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload avatar')
      console.error('Upload avatar error:', error)
    },
  })
}

/**
 * Hook to upload cover photo
 */
export const useUploadCover = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: uploadCover,
    onSuccess: (response) => {
      const updatedUser = response.data

      // Update auth store
      updateUser(updatedUser)

      // Update profile cache
      queryClient.setQueryData(['user', user.username], (old) => ({
        ...old,
        data: updatedUser,
      }))

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', user.username] })

      toast.success('Cover photo updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload cover photo')
      console.error('Upload cover error:', error)
    },
  })
}

/**
 * Hook to delete avatar
 */
export const useDeleteAvatar = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (response) => {
      const updatedUser = response.data

      // Update auth store
      updateUser(updatedUser)

      // Update profile cache
      queryClient.setQueryData(['user', user.username], (old) => ({
        ...old,
        data: updatedUser,
      }))

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', user.username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })

      toast.success('Avatar removed successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove avatar')
      console.error('Delete avatar error:', error)
    },
  })
}

/**
 * Hook to delete cover photo
 */
export const useDeleteCover = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: deleteCover,
    onSuccess: (response) => {
      const updatedUser = response.data

      // Update auth store
      updateUser(updatedUser)

      // Update profile cache
      queryClient.setQueryData(['user', user.username], (old) => ({
        ...old,
        data: updatedUser,
      }))

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', user.username] })

      toast.success('Cover photo removed successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove cover photo')
      console.error('Delete cover error:', error)
    },
  })
}

/**
 * Hook to get user posts with pagination
 */
export const useUserPosts = (username, options = {}) => {
  return useQuery({
    queryKey: ['userPosts', username],
    queryFn: () => getUserPosts(username, 1, 10),
    enabled: !!username,
    ...options,
  })
}

/**
 * Hook to get user posts with infinite scroll
 */
export const useInfiniteUserPosts = (username) => {
  return useInfiniteQuery({
    queryKey: ['userPosts', username],
    queryFn: ({ pageParam = 1 }) => getUserPosts(username, pageParam, 10),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination || {}
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    enabled: !!username,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to search users
 */
export const useSearchUsers = (query, options = {}) => {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query),
    enabled: !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}
