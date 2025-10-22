import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addShareReaction,
  removeShareReaction,
  getShareReactions,
} from "../../services/ShareFeature/shareReactionService";
export const useAddShareReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, reactionType }) =>
      addShareReaction(shareId, reactionType),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["share", variables.shareId] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to add reaction");
    },
  });
};
export const useRemoveShareReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId) => removeShareReaction(shareId),
    onSuccess: (data, shareId) => {
      queryClient.invalidateQueries({ queryKey: ["share", shareId] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    },
  });
};
export const useShareReactions = (shareId) => {
  return useQuery({
    queryKey: ["share-reactions", shareId],
    queryFn: () => getShareReactions(shareId),
    enabled: !!shareId,
    staleTime: 30000, // 30 seconds
  });
};
