import { Skeleton } from "@/components/ui/skeleton";

export function LikesModalUserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

export function LikesModalSkeleton({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <LikesModalUserSkeleton key={i} />
      ))}
    </div>
  );
}
