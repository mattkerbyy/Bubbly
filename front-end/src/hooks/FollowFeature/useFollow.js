import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as followService from "../../services/FollowFeature/followService";
import { useAuthStore } from "../../stores/useAuthStore";

/**
 * Hook to follow a user
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: followService.followUser,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["followStatus", userId] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      const previousStatus = queryClient.getQueryData(["followStatus", userId]);
      const previousProfile = queryClient.getQueryData(["profile", userId]);
      queryClient.setQueryData(["followStatus", userId], (old) => ({
        ...old,
        data: { isFollowing: true },
      }));
      if (previousProfile) {
        queryClient.setQueryData(["profile", userId], (old) => ({
          ...old,
          data: {
            ...old.data,
            _count: {
              ...old.data._count,
              followers: (old.data._count?.followers || 0) + 1,
            },
          },
        }));
      }

      return { previousStatus, previousProfile };
    },
    onError: (error, userId, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          ["followStatus", userId],
          context.previousStatus
        );
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile", userId], context.previousProfile);
      }

      const message = error.response?.data?.error || "Failed to follow user";
      toast.error(message);
    },
    onSuccess: (data, userId) => {
      toast.success("User followed successfully");
      queryClient.invalidateQueries({ queryKey: ["followStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({
        queryKey: ["following", currentUser?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

/**
 * Hook to unfollow a user
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: followService.unfollowUser,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["followStatus", userId] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      const previousStatus = queryClient.getQueryData(["followStatus", userId]);
      const previousProfile = queryClient.getQueryData(["profile", userId]);
      queryClient.setQueryData(["followStatus", userId], (old) => ({
        ...old,
        data: { isFollowing: false },
      }));
      if (previousProfile) {
        queryClient.setQueryData(["profile", userId], (old) => ({
          ...old,
          data: {
            ...old.data,
            _count: {
              ...old.data._count,
              followers: Math.max((old.data._count?.followers || 0) - 1, 0),
            },
          },
        }));
      }

      return { previousStatus, previousProfile };
    },
    onError: (error, userId, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          ["followStatus", userId],
          context.previousStatus
        );
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile", userId], context.previousProfile);
      }

      const message = error.response?.data?.error || "Failed to unfollow user";
      toast.error(message);
    },
    onSuccess: (data, userId) => {
      toast.success("User unfollowed successfully");
      queryClient.invalidateQueries({ queryKey: ["followStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({
        queryKey: ["following", currentUser?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

/**
 * Hook to get followers of a user
 */
export const useInfiniteFollowers = (userId) => {
  return useInfiniteQuery({
    queryKey: ["followers", userId],
    queryFn: ({ pageParam = 1 }) =>
      followService.getFollowers(userId, pageParam),
    getNextPageParam: (lastPage) => {
      const { currentPage, hasMore } = lastPage.pagination;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get users that a user is following
 */
export const useInfiniteFollowing = (userId) => {
  return useInfiniteQuery({
    queryKey: ["following", userId],
    queryFn: ({ pageParam = 1 }) =>
      followService.getFollowing(userId, pageParam),
    getNextPageParam: (lastPage) => {
      const { currentPage, hasMore } = lastPage.pagination;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: !!userId,
  });
};

/**
 * Hook to check if current user is following a user
 */
export const useFollowStatus = (userId) => {
  const currentUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["followStatus", userId],
    queryFn: () => followService.checkFollowStatus(userId),
    enabled: !!userId && !!currentUser && currentUser.id !== userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to get suggested users to follow
 */
export const useSuggestedUsers = (limit = 5) => {
  return useQuery({
    queryKey: ["suggestedUsers", limit],
    queryFn: () => followService.getSuggestedUsers(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
