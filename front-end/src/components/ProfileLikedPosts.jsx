import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { useUserReactedPosts } from '@/hooks/useReactions'
import Post from '@/components/Post'
import { PostSkeleton } from '@/components/skeletons/PostSkeleton'
import { Button } from './ui/button'

export default function ProfileLikedPosts({ userId }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserReactedPosts(userId)

  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page.data) || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-8 text-center"
      >
        <p className="text-muted-foreground mb-4">
          {error?.response?.data?.error || 'Failed to load reacted posts'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </motion.div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No reacted posts yet</h3>
        <p className="text-muted-foreground">
          Posts you react to will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <p>You've reached the end! 🎉</p>
        </motion.div>
      )}
    </div>
  )
}
