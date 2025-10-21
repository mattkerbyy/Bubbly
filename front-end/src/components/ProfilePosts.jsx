import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mailbox, Loader2 } from 'lucide-react'
import { useInfiniteUserPosts } from '@/hooks/useUsers'
import Post from './Post'
import { ProfilePostsSkeleton } from './skeletons/ProfileSkeleton'
import { Button } from './ui/button'

export default function ProfilePosts({ username }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteUserPosts(username)

  const { ref, inView } = useInView({
    threshold: 0,
  })

  // Auto-fetch next page when scrolling into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return <ProfilePostsSkeleton count={3} />
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-8 text-center"
      >
        <p className="text-muted-foreground mb-4">
          {error?.response?.data?.error || 'Failed to load posts'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </motion.div>
    )
  }

  const posts = data?.pages.flatMap((page) => page.data) || []

  if (posts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Mailbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No reacted posts yet</h3>
        <p className="text-muted-foreground">
          {username} hasn't posted anything yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </AnimatePresence>

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          )}
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground"
        >
          <p>You've reached the end! 🎉</p>
        </motion.div>
      )}
    </div>
  )
}
