import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createShareComment,
  getShareComments,
  deleteShareComment,
  updateShareComment,
} from "../../services/ShareFeature/shareCommentService";
export const useCreateShareComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, content }) => createShareComment(shareId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["share-comments", variables.shareId],
      });
      queryClient.invalidateQueries({ queryKey: ["share", variables.shareId] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to add comment");
    },
  });
};
export const useShareComments = (shareId) => {
  return useInfiniteQuery({
    queryKey: ["share-comments", shareId, "infinite"],
    queryFn: ({ pageParam }) => getShareComments(shareId, pageParam),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: !!shareId,
    staleTime: 30000, // 30 seconds
  });
};
export const useUpdateShareComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content, shareId }) =>
      updateShareComment(commentId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["share-comments", variables.shareId],
      });
      queryClient.invalidateQueries({ queryKey: ["share", variables.shareId] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update comment");
    },
  });
};
export const useDeleteShareComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, shareId }) => deleteShareComment(commentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["share-comments", variables.shareId],
      });
      queryClient.invalidateQueries({ queryKey: ["share", variables.shareId] });
      queryClient.invalidateQueries({ queryKey: ["userShares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete comment");
    },
  });
};
