import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, BellOff, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import NotificationItem from './NotificationItem'
import {
  useInfiniteNotifications,
  useMarkAllAsRead,
  useDeleteAllNotifications,
} from '@/hooks/useNotifications'

export default function NotificationsList({ onClose }) {
  const observerTarget = useRef(null)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications()

  const markAllAsReadMutation = useMarkAllAsRead()
  const deleteAllMutation = useDeleteAllNotifications()

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-sm text-destructive">
          {error?.response?.data?.error || 'Failed to load notifications'}
        </p>
      </div>
    )
  }

  const notifications = data?.pages.flatMap((page) => page.data) || []
  const unreadCount = data?.pages[0]?.unreadCount || 0

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
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Action Buttons */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b border-border flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex-1 text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all notifications?')) {
                deleteAllMutation.mutate()
              }
            }}
            disabled={deleteAllMutation.isPending}
            className="flex-1 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear all
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
    </div>
  )
}
