import { motion } from "framer-motion";

export function PostSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-lg p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
      </div>

      {/* Image placeholder */}
      <div className="h-64 w-full bg-muted rounded-lg animate-pulse" />

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>
    </motion.div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
