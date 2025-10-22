import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  toggleLike,
  getPostLikes,
  checkUserLiked,
  getUserLikedPosts,
} from "@/services/ReactionFeature/likeService";
import { toast } from "sonner";
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) => {
              const posts = page.data?.posts || page.posts || [];
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
              );
              if (page.data?.posts) {
                return {
                  ...page,
                  data: {
                    ...page.data,
                    posts: updatedPosts,
                  },
                };
              }
              return {
                ...page,
                posts: updatedPosts,
              };
            }),
          };
        }
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
          };
        }

        return old;
      });

      return { previousPosts };
    },
    onError: (error, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] }); // Invalidate all individual post queries
    },
  });
};
export const usePostLikes = (postId, options = {}) => {
  return useQuery({
    queryKey: ["likes", postId],
    queryFn: () => getPostLikes(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useCheckUserLiked = (postId, options = {}) => {
  return useQuery({
    queryKey: ["userLiked", postId],
    queryFn: () => checkUserLiked(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useUserLikedPosts = (userId) => {
  return useInfiniteQuery({
    queryKey: ["likedPosts", userId],
    queryFn: ({ pageParam = 1 }) => getUserLikedPosts(userId, pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    enabled: !!userId,
  });
};
