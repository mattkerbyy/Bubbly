import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  sharePost,
  unsharePost,
  getPostShares,
  checkUserShared,
  getUserShares,
} from "@/services/ShareFeature/shareService";
import { toast } from "sonner";
export const useSharePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, shareCaption, audience }) =>
      sharePost(postId, shareCaption, audience),
    onSuccess: () => {
      toast.success("Post shared successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["shares"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.error || "Failed to share post";
      toast.error(errorMessage);
    },
  });
};
export const useUnsharePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsharePost,
    onSuccess: () => {
      toast.success("Post unshared successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["shares"] });
    },
    onError: () => {
      toast.error("Failed to unshare post");
    },
  });
};
export const usePostShares = (postId, options = {}) => {
  return useQuery({
    queryKey: ["shares", postId],
    queryFn: () => getPostShares(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useCheckUserShared = (postId, options = {}) => {
  return useQuery({
    queryKey: ["userShared", postId],
    queryFn: () => checkUserShared(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useUserShares = (userId) => {
  return useInfiniteQuery({
    queryKey: ["userShares", userId],
    queryFn: ({ pageParam = 1 }) => getUserShares(userId, pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    enabled: !!userId,
  });
};
