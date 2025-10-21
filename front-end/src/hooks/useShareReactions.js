import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addShareReaction,
  removeShareReaction,
  getShareReactions
} from '../services/shareReactionService';

// Hook to add or update reaction on a share
export const useAddShareReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, reactionType }) => addShareReaction(shareId, reactionType),
    onSuccess: (data, variables) => {
      // Invalidate share queries
  queryClient.invalidateQueries({ queryKey: ['share', variables.shareId] });
  queryClient.invalidateQueries({ queryKey: ['userShares'] });
  queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add reaction');
    }
  });
};

// Hook to remove reaction from a share
export const useRemoveShareReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId) => removeShareReaction(shareId),
    onSuccess: (data, shareId) => {
      // Invalidate share queries
  queryClient.invalidateQueries({ queryKey: ['share', shareId] });
  queryClient.invalidateQueries({ queryKey: ['userShares'] });
  queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove reaction');
    }
  });
};

// Hook to get reactions for a share
export const useShareReactions = (shareId) => {
  return useQuery({
    queryKey: ['share-reactions', shareId],
    queryFn: () => getShareReactions(shareId),
    enabled: !!shareId,
    staleTime: 30000 // 30 seconds
  });
};
