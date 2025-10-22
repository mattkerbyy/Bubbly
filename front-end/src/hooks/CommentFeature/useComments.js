import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  createShareComment,
  getPostComments,
  getShareComments,
  updateComment,
  deleteComment,
} from "@/services/CommentFeature/commentService";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

const adjustPostCommentCount = (queryClient, postId, delta) => {
  queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
    if (!old) return old;

    if (old.pages) {
      return {
        ...old,
        pages: old.pages.map((page) => {
          const pagePosts = page.data?.posts || page.data || page.posts;
          if (!Array.isArray(pagePosts)) return page;

          const updatedPosts = pagePosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  _count: {
                    ...post._count,
                    comments: Math.max((post._count?.comments || 0) + delta, 0),
                  },
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

          if (page.posts) {
            return {
              ...page,
              posts: updatedPosts,
            };
          }

          return {
            ...page,
            data: updatedPosts,
          };
        }),
      };
    }

    if (Array.isArray(old)) {
      return old.map((post) =>
        post.id === postId
          ? {
              ...post,
              _count: {
                ...post._count,
                comments: Math.max((post._count?.comments || 0) + delta, 0),
              },
            }
          : post
      );
    }

    return old;
  });
};

const adjustShareCommentCount = (queryClient, shareId, delta) => {
  queryClient.setQueryData(["share", shareId], (old) => {
    if (!old?.data && !old?._count) return old;

    if (old?.data) {
      const shareData = old.data;
      return {
        ...old,
        data: {
          ...shareData,
          _count: {
            ...shareData._count,
            comments: Math.max((shareData._count?.comments || 0) + delta, 0),
          },
        },
      };
    }

    return {
      ...old,
      _count: {
        ...old._count,
        comments: Math.max((old._count?.comments || 0) + delta, 0),
      },
    };
  });
};
export const usePostComments = (postId, options = {}) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
    ...options,
  });
};
export const useShareComments = (shareId, options = {}) => {
  return useQuery({
    queryKey: ["share-comments", shareId, "list"],
    queryFn: () => getShareComments(shareId),
    enabled: !!shareId,
    ...options,
  });
};
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const buildOptimisticComment = ({ content, postId, shareId }) => ({
    id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postId: postId || null,
    shareId: shareId || null,
    userId: user?.id || "current-user",
    user: user
      ? {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          verified: user.verified,
        }
      : {
          id: "current-user",
          name: "You",
          username: "you",
          avatar: null,
          verified: false,
        },
  });

  return useMutation({
    mutationFn: ({ postId, shareId, content }) => {
      if (postId) {
        return createComment(postId, content);
      } else if (shareId) {
        return createShareComment(shareId, content);
      }
      throw new Error("Either postId or shareId is required");
    },
    onMutate: async (variables) => {
      const { postId, shareId, content } = variables;
      const optimisticComment = buildOptimisticComment({
        content,
        postId,
        shareId,
      });

      if (postId) {
        await queryClient.cancelQueries({ queryKey: ["comments", postId] });
        const previousComments = queryClient.getQueryData(["comments", postId]);

        if (previousComments?.comments) {
          queryClient.setQueryData(["comments", postId], {
            ...previousComments,
            comments: [optimisticComment, ...previousComments.comments],
            totalComments: (previousComments.totalComments || 0) + 1,
          });
        } else {
          queryClient.setQueryData(["comments", postId], {
            comments: [optimisticComment],
            totalComments: 1,
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
          });
        }

        adjustPostCommentCount(queryClient, postId, 1);

        return {
          contextType: "post",
          postId,
          tempId: optimisticComment.id,
          previousComments,
        };
      }

      if (shareId) {
        await queryClient.cancelQueries({
          queryKey: ["share-comments", shareId],
        });
        const infiniteKey = ["share-comments", shareId, "infinite"];
        const listKey = ["share-comments", shareId, "list"];
        const previousInfinite = queryClient.getQueryData(infiniteKey);
        const previousList = queryClient.getQueryData(listKey);

        if (previousInfinite?.pages) {
          const updatedPages = previousInfinite.pages.map((page, index) => {
            if (index !== 0) return page;
            const existingComments = page?.comments || [];
            return {
              ...page,
              comments: [optimisticComment, ...existingComments],
            };
          });

          queryClient.setQueryData(infiniteKey, {
            ...previousInfinite,
            pages: updatedPages,
          });
        }

        if (previousList) {
          const existingListComments = previousList.comments || [];
          queryClient.setQueryData(listKey, {
            ...previousList,
            comments: [optimisticComment, ...existingListComments],
          });
        }

        adjustShareCommentCount(queryClient, shareId, 1);

        return {
          contextType: "share",
          shareId,
          tempId: optimisticComment.id,
          previousInfinite,
          previousList,
        };
      }

      return null;
    },
    onError: (error, variables, context) => {
      if (!context) {
        toast.error("Failed to add comment");
        return;
      }

      if (context.contextType === "post" && context.postId) {
        queryClient.setQueryData(
          ["comments", context.postId],
          context.previousComments
        );
        adjustPostCommentCount(queryClient, context.postId, -1);
      }

      if (context.contextType === "share" && context.shareId) {
        const infiniteKey = ["share-comments", context.shareId, "infinite"];
        const listKey = ["share-comments", context.shareId, "list"];

        if (context.previousInfinite) {
          queryClient.setQueryData(infiniteKey, context.previousInfinite);
        }

        if (context.previousList) {
          queryClient.setQueryData(listKey, context.previousList);
        }

        adjustShareCommentCount(queryClient, context.shareId, -1);
      }

      toast.error("Failed to add comment");
    },
    onSuccess: (data, variables, context) => {
      if (!context) {
        toast.success("Comment added");
        return;
      }

      if (context.contextType === "post" && variables.postId) {
        queryClient.setQueryData(["comments", variables.postId], (oldData) => {
          if (!oldData?.comments) return oldData;
          return {
            ...oldData,
            comments: oldData.comments.map((comment) =>
              comment.id === context.tempId ? data : comment
            ),
          };
        });
      }

      if (context.contextType === "share" && variables.shareId) {
        const infiniteKey = ["share-comments", variables.shareId, "infinite"];
        const listKey = ["share-comments", variables.shareId, "list"];

        queryClient.setQueryData(infiniteKey, (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index !== 0) return page;
              return {
                ...page,
                comments: (page.comments || []).map((comment) =>
                  comment.id === context.tempId ? data : comment
                ),
              };
            }),
          };
        });

        queryClient.setQueryData(listKey, (oldData) => {
          if (!oldData?.comments) return oldData;
          return {
            ...oldData,
            comments: oldData.comments.map((comment) =>
              comment.id === context.tempId ? data : comment
            ),
          };
        });
      }

      toast.success("Comment added");
    },
    onSettled: (data, error, variables) => {
      if (variables?.postId) {
        queryClient.invalidateQueries({
          queryKey: ["comments", variables.postId],
        });
      }
      if (variables?.shareId) {
        queryClient.invalidateQueries({
          queryKey: ["share-comments", variables.shareId],
        });
        queryClient.invalidateQueries({
          queryKey: ["share", variables.shareId],
        });
        queryClient.invalidateQueries({ queryKey: ["userShares"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    },
  });
};
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }) => updateComment(commentId, content),
    onSuccess: (data) => {
      const postId = data.postId;
      queryClient.setQueryData(["comments", postId], (oldData) => {
        if (!oldData?.comments) return oldData;
        return {
          ...oldData,
          comments: oldData.comments.map((comment) =>
            comment.id === data.id
              ? {
                  ...comment,
                  content: data.content,
                  updatedAt: data.updatedAt,
                }
              : comment
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comment updated");
    },
    onError: (error) => {
      toast.error("Failed to update comment");
    },
  });
};
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onMutate: async ({ commentId, postId }) => {
      if (!postId) return null;

      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData(["comments", postId]);

      if (previousComments?.comments) {
        queryClient.setQueryData(["comments", postId], {
          ...previousComments,
          comments: previousComments.comments.filter(
            (comment) => comment.id !== commentId
          ),
          totalComments: Math.max((previousComments.totalComments || 1) - 1, 0),
        });
      }

      adjustPostCommentCount(queryClient, postId, -1);

      const adjustContext = {
        postId,
        previousComments,
        commentId,
      };

      return adjustContext;
    },
    onError: (error, variables, context) => {
      if (context?.postId) {
        queryClient.setQueryData(
          ["comments", context.postId],
          context.previousComments
        );
        adjustPostCommentCount(queryClient, context.postId, 1);
      }
      toast.error("Failed to delete comment");
    },
    onSuccess: (_data, variables, context) => {
      if (context?.postId) {
        queryClient.invalidateQueries({
          queryKey: ["comments", context.postId],
        });
      }
      toast.success("Comment deleted");
    },
  });
};
