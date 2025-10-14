import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { useUserLikedPosts } from '@/hooks/useLikes'
import Post from '@/components/Post'
import { PostSkeleton } from '@/components/skeletons/PostSkeleton'

export default function ProfileLikedPosts({ userId }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserLikedPosts(userId)

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

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Error loading liked posts</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || 'Something went wrong'}
        </p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No liked posts yet</h3>
        <p className="text-muted-foreground">
          Posts you like will appear here
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
