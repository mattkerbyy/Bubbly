import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { sharePost, unsharePost, getPostShares, checkUserShared, getUserShares } from '@/services/shareService'
import { toast } from 'sonner'

// Hook to share a post
export const useSharePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, shareCaption, audience }) => sharePost(postId, shareCaption, audience),
    onSuccess: () => {
      toast.success('Post shared successfully')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['shares'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to share post'
      toast.error(errorMessage)
    },
  })
}

// Hook to unshare a post
export const useUnsharePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unsharePost,
    onSuccess: () => {
      toast.success('Post unshared successfully')
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['shares'] })
    },
    onError: () => {
      toast.error('Failed to unshare post')
    },
  })
}

// Hook to get shares for a post
export const usePostShares = (postId, options = {}) => {
  return useQuery({
    queryKey: ['shares', postId],
    queryFn: () => getPostShares(postId),
    enabled: !!postId,
    ...options,
  })
}

// Hook to check if user shared a post
export const useCheckUserShared = (postId, options = {}) => {
  return useQuery({
    queryKey: ['userShared', postId],
    queryFn: () => checkUserShared(postId),
    enabled: !!postId,
    ...options,
  })
}

// Hook to get posts shared by a user with infinite scroll
export const useUserShares = (userId) => {
  return useInfiniteQuery({
    queryKey: ['userShares', userId],
    queryFn: ({ pageParam = 1 }) => getUserShares(userId, pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.currentPage + 1 
        : undefined
    },
    enabled: !!userId,
  })
}
