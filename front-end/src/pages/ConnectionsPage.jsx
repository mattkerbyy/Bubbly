import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserCard from '@/components/UserCard'
import { SearchUserSkeleton } from '@/components/skeletons/SearchSkeleton'
import { useAuthStore } from '@/stores/useAuthStore'
import { useInfiniteFollowers, useInfiniteFollowing } from '@/hooks/useFollow'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'

export default function ConnectionsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('followers')

  // Fetch followers with infinite scroll
  const {
    data: followersData,
    fetchNextPage: fetchNextFollowers,
    hasNextPage: hasNextFollowers,
    isFetchingNextPage: isFetchingNextFollowers,
    isLoading: isLoadingFollowers,
    error: followersError,
  } = useInfiniteFollowers(user?.id)

  // Fetch following with infinite scroll
  const {
    data: followingData,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasNextFollowing,
    isFetchingNextPage: isFetchingNextFollowing,
    isLoading: isLoadingFollowing,
    error: followingError,
  } = useInfiniteFollowing(user?.id)

  // Intersection observer for infinite scroll
  const { ref: followersRef, inView: followersInView } = useInView()
  const { ref: followingRef, inView: followingInView } = useInView()

  // Fetch more when scrolling to bottom
  useEffect(() => {
    if (followersInView && hasNextFollowers && !isFetchingNextFollowers) {
      fetchNextFollowers()
    }
  }, [followersInView, hasNextFollowers, isFetchingNextFollowers, fetchNextFollowers])

  useEffect(() => {
    if (followingInView && hasNextFollowing && !isFetchingNextFollowing) {
      fetchNextFollowing()
    }
  }, [followingInView, hasNextFollowing, isFetchingNextFollowing, fetchNextFollowing])

  // Flatten the paginated data
  const followers = followersData?.pages.flatMap((page) => page.data) || []
  const following = followingData?.pages.flatMap((page) => page.data) || []

  // Get total counts
  const followersCount = followersData?.pages[0]?.pagination?.total || 0
  const followingCount = followingData?.pages[0]?.pagination?.total || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Connections</h1>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="followers">
              Followers
              {followersCount > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {followersCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="following">
              Following
              {followingCount > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {followingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-4">
            {isLoadingFollowers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SearchUserSkeleton key={i} />
                ))}
              </div>
            ) : followersError ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Error loading followers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {followersError.message || 'Something went wrong'}
                </p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </Card>
            ) : followers.length > 0 ? (
              <>
                <AnimatePresence mode="popLayout">
                  {followers.map((follower) => (
                    <UserCard key={follower.id} user={follower} />
                  ))}
                </AnimatePresence>
                
                {/* Infinite scroll trigger */}
                {hasNextFollowers && (
                  <div ref={followersRef} className="flex justify-center py-4">
                    {isFetchingNextFollowers && (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">No followers yet</h3>
                <p className="text-sm text-muted-foreground">
                  When someone follows you, they'll appear here
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {isLoadingFollowing ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SearchUserSkeleton key={i} />
                ))}
              </div>
            ) : followingError ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Error loading following</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {followingError.message || 'Something went wrong'}
                </p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </Card>
            ) : following.length > 0 ? (
              <>
                <AnimatePresence mode="popLayout">
                  {following.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </AnimatePresence>
                
                {/* Infinite scroll trigger */}
                {hasNextFollowing && (
                  <div ref={followingRef} className="flex justify-center py-4">
                    {isFetchingNextFollowing && (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
                <p className="text-sm text-muted-foreground">
                  Find people to follow and they'll appear here
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
