import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toggleLike, getPostLikes, checkUserLiked, getUserLikedPosts } from '@/services/likeService'
import { toast } from 'sonner'

// Hook to toggle like on a post
export const useToggleLike = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleLike,
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['posts'])

      // Optimistically update posts
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old) return old

        if (old.pages) {
          // Infinite query data
          return {
            ...old,
            pages: old.pages.map((page) => {
              // Handle both page.data.posts and page.posts structures
              const posts = page.data?.posts || page.posts || []
              const updatedPosts = posts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      _count: {
                        ...post._count,
                        likes: post.isLiked
                          ? (post._count?.likes || 1) - 1
                          : (post._count?.likes || 0) + 1,
                      },
                      isLiked: !post.isLiked,
                    }
                  : post
              )
              
              // Return in the same structure it came in
              if (page.data?.posts) {
                return {
                  ...page,
                  data: {
                    ...page.data,
                    posts: updatedPosts,
                  },
                }
              }
              return {
                ...page,
                posts: updatedPosts,
              }
            }),
          }
        }

        // Single post query data
        if (old.data) {
          return {
            ...old,
            data: {
              ...old.data,
              _count: {
                ...old.data._count,
                likes: old.data.isLiked
                  ? (old.data._count?.likes || 1) - 1
                  : (old.data._count?.likes || 0) + 1,
              },
              isLiked: !old.data.isLiked,
            },
          }
        }

        return old
      })

      return { previousPosts }
    },
    onError: (error, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts)
      }
      toast.error('Failed to update like')
      // Error handled by toast
    },
    onSettled: () => {
      // Refetch to ensure data is in sync across all pages
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] }) // Invalidate all individual post queries
    },
  })
}

// Hook to get likes for a post
export const usePostLikes = (postId, options = {}) => {
  return useQuery({
    queryKey: ['likes', postId],
    queryFn: () => getPostLikes(postId),
    enabled: !!postId,
    ...options,
  })
}

// Hook to check if user liked a post
export const useCheckUserLiked = (postId, options = {}) => {
  return useQuery({
    queryKey: ['userLiked', postId],
    queryFn: () => checkUserLiked(postId),
    enabled: !!postId,
    ...options,
  })
}

// Hook to get posts liked by a user with infinite scroll
export const useUserLikedPosts = (userId) => {
  return useInfiniteQuery({
    queryKey: ['likedPosts', userId],
    queryFn: ({ pageParam = 1 }) => getUserLikedPosts(userId, pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.currentPage + 1 
        : undefined
    },
    enabled: !!userId,
  })
}
