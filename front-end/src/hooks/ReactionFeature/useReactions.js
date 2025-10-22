import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  addOrUpdateReaction,
  removeReaction,
  getPostReactions,
  checkUserReaction,
  getUserReactedPosts,
} from "@/services/ReactionFeature/reactionService";
import { toast } from "sonner";
export const useAddOrUpdateReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, reactionType }) =>
      addOrUpdateReaction(postId, reactionType),
    onMutate: async ({ postId, reactionType }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) => {
              const posts = page.data?.posts || page.posts || [];
              const updatedPosts = posts.map((post) => {
                if (post.id === postId) {
                  const hadReaction =
                    post.reactions && post.reactions.length > 0;
                  return {
                    ...post,
                    _count: {
                      ...post._count,
                      reactions: hadReaction
                        ? post._count?.reactions || 1
                        : (post._count?.reactions || 0) + 1,
                    },
                    reactions: [{ reactionType }], // Match backend structure
                  };
                }
                return post;
              });

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
          const hadReaction =
            old.data.reactions && old.data.reactions.length > 0;
          return {
            ...old,
            data: {
              ...old.data,
              _count: {
                ...old.data._count,
                reactions: hadReaction
                  ? old.data._count?.reactions || 1
                  : (old.data._count?.reactions || 0) + 1,
              },
              reactions: [{ reactionType }], // Match backend structure
            },
          };
        }

        return old;
      });

      return { previousPosts };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) => {
              const posts = page.data?.posts || page.posts || [];
              const updatedPosts = posts.map((post) => {
                if (post.id === variables.postId) {
                  return {
                    ...post,
                    reactions: [{ reactionType: variables.reactionType }],
                    _count: {
                      ...post._count,
                      reactions:
                        data.totalReactions || post._count?.reactions || 1,
                    },
                  };
                }
                return post;
              });

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
              reactions: [{ reactionType: variables.reactionType }],
              _count: {
                ...old.data._count,
                reactions:
                  data.totalReactions || old.data._count?.reactions || 1,
              },
            },
          };
        }

        return old;
      });
      queryClient.invalidateQueries({
        queryKey: ["reactions", variables.postId],
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to update reaction");
    },
  });
};
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeReaction,
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
                        reactions: Math.max(
                          (post._count?.reactions || 1) - 1,
                          0
                        ),
                      },
                      reactions: [], // Empty array when no reaction
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
                reactions: Math.max((old.data._count?.reactions || 1) - 1, 0),
              },
              reactions: [], // Empty array when no reaction
            },
          };
        }

        return old;
      });

      return { previousPosts };
    },
    onSuccess: (data, postId) => {
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) => {
              const posts = page.data?.posts || page.posts || [];
              const updatedPosts = posts.map((post) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    reactions: [],
                    _count: {
                      ...post._count,
                      reactions: 0,
                    },
                  };
                }
                return post;
              });

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
              reactions: [],
              _count: {
                ...old.data._count,
                reactions: 0,
              },
            },
          };
        }

        return old;
      });
      queryClient.invalidateQueries({ queryKey: ["reactions", postId] });
    },
    onError: (error, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to remove reaction");
    },
  });
};
export const usePostReactions = (postId, reactionType = null, options = {}) => {
  return useQuery({
    queryKey: ["reactions", postId, reactionType],
    queryFn: () => getPostReactions(postId, 1, 20, reactionType),
    enabled: !!postId,
    ...options,
  });
};
export const useCheckUserReaction = (postId, options = {}) => {
  return useQuery({
    queryKey: ["userReaction", postId],
    queryFn: () => checkUserReaction(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useUserReactedPosts = (userId) => {
  return useInfiniteQuery({
    queryKey: ["reactedPosts", userId],
    queryFn: ({ pageParam = 1 }) => getUserReactedPosts(userId, pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    enabled: !!userId,
  });
};
