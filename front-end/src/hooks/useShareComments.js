import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createShareComment,
  getShareComments,
  deleteShareComment,
  updateShareComment,
} from '../services/shareCommentService'

// Hook to create a comment on a share
export const useCreateShareComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shareId, content }) => createShareComment(shareId, content),
    onSuccess: (data, variables) => {
      // Invalidate comments query for this share
  queryClient.invalidateQueries({ queryKey: ['share-comments', variables.shareId] })
      // Invalidate share query to update comment count
  queryClient.invalidateQueries({ queryKey: ['share', variables.shareId] })
  queryClient.invalidateQueries({ queryKey: ['userShares'] })
  queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Comment added successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add comment')
    },
  })
}

// Hook to get comments for a share with infinite scroll
export const useShareComments = (shareId) => {
  return useInfiniteQuery({
  queryKey: ['share-comments', shareId, 'infinite'],
    queryFn: ({ pageParam }) => getShareComments(shareId, pageParam),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled: !!shareId,
    staleTime: 30000, // 30 seconds
  })
}

// Hook to update a comment on a share
export const useUpdateShareComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content, shareId }) => updateShareComment(commentId, content),
    onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: ['share-comments', variables.shareId] })
  queryClient.invalidateQueries({ queryKey: ['share', variables.shareId] })
  queryClient.invalidateQueries({ queryKey: ['userShares'] })
  queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Comment updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update comment')
    },
  })
}

// Hook to delete a comment from a share
export const useDeleteShareComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, shareId }) => deleteShareComment(commentId),
    onSuccess: (data, variables) => {
      // Invalidate comments query for this share
  queryClient.invalidateQueries({ queryKey: ['share-comments', variables.shareId] })
  // Invalidate share query to update comment count
  queryClient.invalidateQueries({ queryKey: ['share', variables.shareId] })
  queryClient.invalidateQueries({ queryKey: ['userShares'] })
  queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Comment deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete comment')
    },
  })
}
