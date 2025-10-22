import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { postService } from "@/services/PostFeature/postService";
import { toast } from "sonner";
export const postKeys = {
  all: ["posts"],
  lists: () => [...postKeys.all, "list"],
  list: (filters) => [...postKeys.lists(), filters],
  details: () => [...postKeys.all, "detail"],
  detail: (id) => [...postKeys.details(), id],
  userPosts: (userId) => [...postKeys.all, "user", userId],
};
export const useInfinitePosts = () => {
  return useInfiniteQuery({
    queryKey: postKeys.lists(),
    queryFn: ({ pageParam = 1 }) =>
      postService.getPosts({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
export const usePost = (postId) => {
  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => postService.getPostById(postId),
    enabled: !!postId,
  });
};
export const useUserPosts = (userId) => {
  return useInfiniteQuery({
    queryKey: postKeys.userPosts(userId),
    queryFn: ({ pageParam = 1 }) =>
      postService.getUserPosts(userId, { page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    enabled: !!userId,
  });
};
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to create post");
    },
  });
};
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, postData }) =>
      postService.updatePost(postId, postData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(variables.postId),
      });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      toast.success("Post updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update post");
    },
  });
};
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.deletePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });
      const previousPosts = queryClient.getQueryData(postKeys.lists());
      queryClient.setQueryData(postKeys.lists(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((post) => post.id !== postId),
          })),
        };
      });

      return { previousPosts };
    },
    onSuccess: () => {
      toast.success("Post deleted successfully!");
    },
    onError: (error, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.lists(), context.previousPosts);
      }
      toast.error(error.response?.data?.error || "Failed to delete post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
export const useDeleteShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.deleteShare,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });
      const previousPosts = queryClient.getQueryData(postKeys.lists());
      queryClient.setQueryData(postKeys.lists(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((item) => {
              if (item.type === "share" && item.postId === postId) {
                return false;
              }
              return true;
            }),
          })),
        };
      });

      return { previousPosts };
    },
    onSuccess: () => {
      toast.success("Share removed successfully!");
    },
    onError: (error, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.lists(), context.previousPosts);
      }
      toast.error(error.response?.data?.error || "Failed to remove share");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
