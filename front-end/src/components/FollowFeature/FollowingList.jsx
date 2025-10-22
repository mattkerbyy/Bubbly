import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInfiniteFollowing,
  useFollowUser,
  useUnfollowUser,
} from "@/hooks/FollowFeature/useFollow";
import { useAuthStore } from "@/stores/useAuthStore";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function FollowingList({ userId }) {
  const currentUser = useAuthStore((state) => state.user);
  const [localFollowStates, setLocalFollowStates] = useState({});
  const observerTarget = useRef(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFollowing(userId);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handleFollow = (followingId) => {
    setLocalFollowStates((prev) => ({ ...prev, [followingId]: true }));
    followMutation.mutate(followingId, {
      onError: () => {
        setLocalFollowStates((prev) => ({ ...prev, [followingId]: false }));
      },
    });
  };

  const handleUnfollow = (followingId) => {
    setLocalFollowStates((prev) => ({ ...prev, [followingId]: false }));
    unfollowMutation.mutate(followingId, {
      onError: () => {
        setLocalFollowStates((prev) => ({ ...prev, [followingId]: true }));
      },
    });
  };

  const getFollowStatus = (followingUser) => {
    if (localFollowStates[followingUser.id] !== undefined) {
      return localFollowStates[followingUser.id];
    }
    return followingUser.isFollowing;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          {error?.response?.data?.error || "Failed to load following"}
        </p>
      </div>
    );
  }

  const following = data?.pages.flatMap((page) => page.data) || [];

  if (following.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Not following anyone yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {following.map((followingUser, index) => {
        const isFollowing = getFollowStatus(followingUser);
        const isOwnProfile = currentUser?.id === followingUser.id;

        return (
          <motion.div
            key={followingUser.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            {/* Avatar */}
            <Link to={`/profile/${followingUser.username}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={getImageUrl(followingUser.avatar)} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(followingUser.name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* User Info */}
            <Link
              to={`/profile/${followingUser.username}`}
              className="flex-1 min-w-0"
            >
              <div>
                <p className="font-semibold text-foreground hover:underline truncate">
                  {followingUser.name || followingUser.username}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    @{followingUser.username}
                  </p>
                  {followingUser.verified && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </div>
                {followingUser.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {followingUser.bio}
                  </p>
                )}
              </div>
            </Link>

            {/* Follow Button */}
            {!isOwnProfile && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  isFollowing
                    ? handleUnfollow(followingUser.id)
                    : handleFollow(followingUser.id)
                }
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className="flex-shrink-0"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </motion.div>
        );
      })}

      {/* Loading more indicator */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
        </div>
      )}
    </div>
  );
}
