import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { forwardRef } from "react";
import { MapPin, Calendar, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFollowUser, useUnfollowUser } from "@/hooks/FollowFeature/useFollow";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

const UserCard = forwardRef(({ user, compact = false }, ref) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = user.isFollowing;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handleFollowToggle = (e) => {
    e.stopPropagation();
    if (isFollowing) {
      unfollowMutation.mutate(user.id);
    } else {
      followMutation.mutate(user.id);
    }
  };

  const handleCardClick = () => {
    navigate(`/profile/${user.username}`);
  };

  if (compact) {
    return (
      <motion.button
        onClick={handleCardClick}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
          <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium text-sm truncate">
              {user.name || user.username}
            </p>
            {user.verified && (
              <svg
                className="h-4 w-4 text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
        </div>
      </motion.button>
    );
  }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="p-6 hover:shadow-lg transition-all cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-background group-hover:ring-primary/20 transition-all">
            <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
            <AvatarFallback className="text-xl">
              {user.name?.[0] || user.username[0]}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {user.name || user.username}
                  </h3>
                  {user.verified && (
                    <svg
                      className="h-5 w-5 text-primary flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  @{user.username}
                </p>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                    {user.bio}
                  </p>
                )}

                {/* User Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {user.followersCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>
                        <span className="font-semibold text-foreground">
                          {user.followersCount}
                        </span>{" "}
                        followers
                      </span>
                    </div>
                  )}
                  {user.postsCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        <span className="font-semibold text-foreground">
                          {user.postsCount}
                        </span>{" "}
                        posts
                      </span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowToggle}
                  disabled={
                    followMutation.isPending || unfollowMutation.isPending
                  }
                  className={cn(
                    "flex-shrink-0",
                    isFollowing &&
                      "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  )}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span className="hidden group-hover:inline">
                        Unfollow
                      </span>
                      <span className="group-hover:hidden">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

UserCard.displayName = "UserCard";

export default UserCard;
