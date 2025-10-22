import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileHeaderSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Cover photo skeleton */}
      <Skeleton className="w-full h-64 md:h-80 rounded-none" />

      <CardContent className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-20">
          {/* Avatar skeleton */}
          <Skeleton className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-background" />

          <div className="flex-1 space-y-4 pt-4 sm:pt-0 w-full">
            {/* Name and username */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Bio */}
            <Skeleton className="h-16 w-full max-w-2xl" />

            {/* Stats */}
            <div className="flex gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Location and website */}
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* Action button */}
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfilePostsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>

            {/* Image (random for variety) */}
            {i % 2 === 0 && (
              <Skeleton className="h-64 w-full rounded-lg mb-4" />
            )}

            {/* Actions */}
            <div className="flex gap-6 pt-2 border-t">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Profile header skeleton */}
          <ProfileHeaderSkeleton />

          {/* Tabs skeleton */}
          <div className="flex gap-4 border-b">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>

          {/* Posts skeleton */}
          <ProfilePostsSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}
