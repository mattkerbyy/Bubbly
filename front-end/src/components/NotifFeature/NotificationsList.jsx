import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NotificationItem from "./NotificationItem";
import {
  useInfiniteNotifications,
  useMarkAllAsRead,
  useDeleteAllNotifications,
} from "@/hooks/NotifFeature/useNotifications";

export default function NotificationsList({ onClose }) {
  const observerTarget = useRef(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications();

  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteAllMutation = useDeleteAllNotifications();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-sm text-destructive">
          {error?.response?.data?.error || "Failed to load notifications"}
        </p>
      </div>
    );
  }

  const notifications = data?.pages.flatMap((page) => page.data) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BellOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No notifications yet</h3>
        <p className="text-sm text-muted-foreground">
          When someone likes, comments, or follows you, you'll see it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Action Buttons */}
      {unreadCount > 0 && (
        <div className="px-3 md:px-4 py-2 border-b border-border flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex-1 text-xs h-8"
          >
            <CheckCheck className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
            <span className="hidden xs:inline">Mark all read</span>
            <span className="xs:hidden">Read all</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteAllMutation.isPending}
            className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
            <span className="hidden xs:inline">Clear all</span>
            <span className="xs:hidden">Clear</span>
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <div key={notification.id}>
              <NotificationItem notification={notification} onClose={onClose} />
              {index < notifications.length - 1 && <Separator />}
            </div>
          ))}
        </AnimatePresence>

        {/* Loading more indicator */}
        {hasNextPage && (
          <div ref={observerTarget} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && notifications.length > 5 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            You're all caught up! 🎉
          </div>
        )}
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your notifications will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAllMutation.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
