import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInfiniteFollowers,
  useFollowUser,
  useUnfollowUser,
} from "@/hooks/FollowFeature/useFollow";
import { useAuthStore } from "@/stores/useAuthStore";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function FollowersList({ userId }) {
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
  } = useInfiniteFollowers(userId);

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

  const handleFollow = (followerId) => {
    setLocalFollowStates((prev) => ({ ...prev, [followerId]: true }));
    followMutation.mutate(followerId, {
      onError: () => {
        setLocalFollowStates((prev) => ({ ...prev, [followerId]: false }));
      },
    });
  };

  const handleUnfollow = (followerId) => {
    setLocalFollowStates((prev) => ({ ...prev, [followerId]: false }));
    unfollowMutation.mutate(followerId, {
      onError: () => {
        setLocalFollowStates((prev) => ({ ...prev, [followerId]: true }));
      },
    });
  };

  const getFollowStatus = (follower) => {
    if (localFollowStates[follower.id] !== undefined) {
      return localFollowStates[follower.id];
    }
    return follower.isFollowing;
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
          {error?.response?.data?.error || "Failed to load followers"}
        </p>
      </div>
    );
  }

  const followers = data?.pages.flatMap((page) => page.data) || [];

  if (followers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No followers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {followers.map((follower, index) => {
        const isFollowing = getFollowStatus(follower);
        const isOwnProfile = currentUser?.id === follower.id;

        return (
          <motion.div
            key={follower.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            {/* Avatar */}
            <Link to={`/profile/${follower.username}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={getImageUrl(follower.avatar)} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(follower.name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* User Info */}
            <Link
              to={`/profile/${follower.username}`}
              className="flex-1 min-w-0"
            >
              <div>
                <p className="font-semibold text-foreground hover:underline truncate">
                  {follower.name || follower.username}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    @{follower.username}
                  </p>
                  {follower.verified && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </div>
                {follower.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {follower.bio}
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
                    ? handleUnfollow(follower.id)
                    : handleFollow(follower.id)
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
