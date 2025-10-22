import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as notificationService from "../../services/NotifFeature/notificationService";
import { useAuthStore } from "../../stores/useAuthStore";

/**
 * Hook to get infinite scroll notifications
 */
export const useInfiniteNotifications = () => {
  const currentUser = useAuthStore((state) => state.user);

  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) =>
      notificationService.getAllNotifications(pageParam),
    getNextPageParam: (lastPage) => {
      const { currentPage, hasMore } = lastPage.pagination;
      return hasMore ? currentPage + 1 : undefined;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Hook to get unread notifications count with polling
 */
export const useUnreadCount = () => {
  const currentUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationService.getUnreadCount,
    enabled: !!currentUser,
    staleTime: 1000 * 5, // 5 seconds for more responsive badge
    refetchInterval: 1000 * 5, // Poll every 5 seconds for real-time badge updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Hook to mark a notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
          })),
        };
      });
      queryClient.setQueryData(["notifications", "unread-count"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            unreadCount: Math.max((old.data?.unreadCount || 0) - 1, 0),
          },
        };
      });

      return { previousNotifications };
    },
    onError: (error, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications
        );
      }
      toast.error("Failed to mark notification as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((notification) => ({
              ...notification,
              isRead: true,
            })),
          })),
        };
      });
      queryClient.setQueryData(["notifications", "unread-count"], (old) => ({
        ...old,
        data: { unreadCount: 0 },
      }));

      return { previousNotifications };
    },
    onError: (error, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications
        );
      }
      toast.error("Failed to mark all notifications as read");
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter(
              (notification) => notification.id !== notificationId
            ),
          })),
        };
      });

      return { previousNotifications };
    },
    onError: (error, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications
        );
      }
      toast.error("Failed to delete notification");
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

/**
 * Hook to delete all notifications
 */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteAllNotifications,
    onSuccess: () => {
      toast.success("All notifications deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: () => {
      toast.error("Failed to delete all notifications");
    },
  });
};
