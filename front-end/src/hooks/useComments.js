import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from '@/services/commentService'
import { toast } from 'sonner'

// Hook to get comments for a post
export const usePostComments = (postId, options = {}) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
    ...options,
  })
}

// Hook to create a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }) => createComment(postId, content),
    onSuccess: (data, variables) => {
      // Invalidate comments query for the post
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      
      // Update post comment count in posts query
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
                post.id === variables.postId
                  ? {
                      ...post,
                      _count: {
                        ...post._count,
                        comments: (post._count?.comments || 0) + 1,
                      },
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

        return old
      })

      toast.success('Comment added')
    },
    onError: (error) => {
      toast.error('Failed to add comment')
      console.error('Error creating comment:', error)
    },
  })
}

// Hook to update a comment
export const useUpdateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }) => updateComment(commentId, content),
    onSuccess: (data) => {
      // Invalidate comments query for the post
      const postId = data.postId
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      toast.success('Comment updated')
    },
    onError: (error) => {
      toast.error('Failed to update comment')
      console.error('Error updating comment:', error)
    },
  })
}

// Hook to delete a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onMutate: async (commentId) => {
      // This will be handled by optimistic update if needed
      return { commentId }
    },
    onSuccess: (data, commentId) => {
      // Invalidate all comments queries
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      
      // Update post comment count in posts query
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old) return old

        if (old.pages) {
          // Infinite query data - decrement comment count
          return {
            ...old,
            pages: old.pages.map((page) => {
              // Handle both page.data.posts and page.posts structures
              const posts = page.data?.posts || page.posts || []
              const updatedPosts = posts.map((post) => ({
                ...post,
                _count: {
                  ...post._count,
                  comments: Math.max((post._count?.comments || 1) - 1, 0),
                },
              }))
              
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

        return old
      })

      toast.success('Comment deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete comment')
      console.error('Error deleting comment:', error)
    },
  })
}
