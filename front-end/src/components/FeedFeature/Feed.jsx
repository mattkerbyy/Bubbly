import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { NotebookPen, Loader2 } from "lucide-react";
import { useInfinitePosts } from "@/hooks/PostFeature/usePosts";
import Post from "@/components/PostFeature/Post";
import SharedPost from "@/components/ShareFeature/SharedPost";
import { FeedSkeleton } from "@/components/skeletons/PostFeature/PostSkeleton";
import { Button } from "@/components/ui/button";

export default function Feed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfinitePosts();

  const { ref, inView } = useInView({
    threshold: 0,
  });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <FeedSkeleton count={3} />;
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-8 text-center"
      >
        <p className="text-muted-foreground mb-4">
          {error?.response?.data?.error || "Failed to load posts"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </motion.div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.data) || [];

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-12 text-center"
      >
        <div className="max-w-md mx-auto">
          <NotebookPen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Be the first to share something! Create a post above to get started.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {posts.map((item) => {
          if (item.type === "share") {
            return <SharedPost key={`share-${item.id}`} share={item} />;
          } else {
            return <Post key={`post-${item.id}`} post={item} />;
          }
        })}
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
  );
}
