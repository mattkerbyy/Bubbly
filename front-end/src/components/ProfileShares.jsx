import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Loader2 } from 'lucide-react'
import { useUserShares } from '@/hooks/useUsers'
import SharedPost from '@/components/SharedPost'
import { PostSkeleton } from '@/components/skeletons/PostSkeleton'
import { Button } from './ui/button'

export default function ProfileShares({ userId }) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUserShares(userId)

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
          {error?.response?.data?.error || 'Failed to load shares'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </motion.div>
    )
  }

  const shares = data?.pages.flatMap((page) => page.data) || []

  if (shares.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No shared posts yet</h3>
        <p className="text-muted-foreground">
          Posts you share will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {shares.map((share) => (
          <SharedPost key={`share-${share.id}`} share={share} />
        ))}
      </AnimatePresence>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
