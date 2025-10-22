import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo Skeleton */}
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />

          {/* Search Bar Skeleton - Desktop */}
          <div className="flex-1 hidden md:flex justify-center">
            <Skeleton className="h-10 w-full max-w-md rounded-full" />
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 md:hidden"></div>

          {/* Right actions skeleton */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle - Desktop */}
            <Skeleton className="hidden md:block h-9 w-9 rounded-full" />

            {/* Notification Bell */}
            <Skeleton className="h-9 w-9 rounded-full" />

            {/* Profile Avatar */}
            <Skeleton className="h-9 w-9 rounded-full" />

            {/* Logout Button - Desktop */}
            <Skeleton className="hidden md:block h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function LeftSidebarSkeleton() {
  return (
    <div className="sticky top-20 space-y-4">
      {/* User profile card skeleton */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Card>

      {/* Navigation skeleton */}
      <Card className="p-2 space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5 rounded shrink-0" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* Main content - 3 column layout */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <LeftSidebarSkeleton />
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-4">
            {/* Create Post Skeleton */}
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded" />
                    <Skeleton className="h-9 w-24 rounded" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Feed Skeleton */}
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </Card>
            ))}
          </main>

          {/* Right Sidebar - Hidden on mobile/tablet */}
          <aside className="hidden xl:block lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              {/* Suggested Users Skeleton */}
              <Card className="p-4">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
