import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPostReactions } from "@/services/ReactionFeature/reactionService";
import { getShareReactions } from "@/services/ShareFeature/shareReactionService";
import { REACTION_TYPES, REACTION_EMOJIS } from "@/services/ReactionFeature/reactionService";
import { useFollowUser, useUnfollowUser } from "@/hooks/FollowFeature/useFollow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { LikesModalSkeleton } from "@/components/skeletons/ReactionFeature/LikesModalSkeleton";
import { cn } from "@/lib/utils";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");
const REACTION_ORDER = ["Like", "Heart", "Laughing", "Wow", "Sad", "Angry"];

export default function ReactionsModal({
  postId,
  shareId,
  isOpen,
  onClose,
  isShare = false,
}) {
  const [reactions, setReactions] = useState([]);
  const [filteredReactions, setFilteredReactions] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuthStore();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const navigate = useNavigate();

  const entityId = isShare ? shareId : postId;

  useEffect(() => {
    if (isOpen && entityId) {
      fetchReactions();
    }
  }, [isOpen, entityId, isShare]);

  useEffect(() => {
    if (activeTab === "All") {
      setFilteredReactions(reactions);
    } else {
      setFilteredReactions(
        reactions.filter((r) => r.reactionType === activeTab)
      );
    }
  }, [activeTab, reactions]);

  const fetchReactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isShare
        ? await getShareReactions(shareId)
        : await getPostReactions(postId);
      console.log("🔍 Reactions data:", {
        isShare,
        entityId: isShare ? shareId : postId,
        reactions: data.reactions,
        firstReaction: data.reactions?.[0],
      });

      setReactions(data.reactions || []);
      setFilteredReactions(data.reactions || []);
    } catch (err) {
      setError("Failed to load reactions");
      console.error("Error fetching reactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(userId);
        setReactions(
          reactions.map((reaction) =>
            reaction.user.id === userId
              ? { ...reaction, user: { ...reaction.user, isFollowing: false } }
              : reaction
          )
        );
      } else {
        await followMutation.mutateAsync(userId);
        setReactions(
          reactions.map((reaction) =>
            reaction.user.id === userId
              ? { ...reaction, user: { ...reaction.user, isFollowing: true } }
              : reaction
          )
        );
      }
    } catch (error) {
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    onClose();
  };
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {});
  const availableReactions = REACTION_ORDER.filter(
    (type) => reactionCounts[type] > 0
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-0">
        <AlertDialogHeader className="border-b p-4 pb-0">
          <div className="flex items-center justify-between pb-3">
            <AlertDialogTitle>Reactions</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>

          {!isLoading && !error && reactions.length > 0 && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-1">
                <TabsTrigger
                  value="All"
                  className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2.5"
                >
                  <span className="font-medium">All</span>
                  <span className="text-xs text-muted-foreground">
                    ({reactions.length})
                  </span>
                </TabsTrigger>
                {availableReactions.map((reactionType) => {
                  const count = reactionCounts[reactionType];
                  return (
                    <TabsTrigger
                      key={reactionType}
                      value={reactionType}
                      className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2.5"
                    >
                      <span className="text-base">
                        {REACTION_EMOJIS[reactionType]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}
        </AlertDialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <LikesModalSkeleton count={5} />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReactions}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : filteredReactions.length === 0 ? (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <p className="text-lg mb-1">
                {activeTab === "All" ? "😊" : REACTION_EMOJIS[activeTab]}
              </p>
              <p>
                {activeTab === "All"
                  ? "No reactions yet"
                  : `No ${activeTab} reactions`}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredReactions.map((reaction) => {
                const isOwnProfile = currentUser?.id === reaction.user.id;
                const isFollowing = reaction.user.isFollowing;

                return (
                  <motion.div
                    key={reaction.user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(reaction.user.username)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getImageUrl(reaction.user.avatar)}
                          />
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {getInitials(reaction.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Reaction emoji badge - improved positioning */}
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-background rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                          <span className="text-base leading-none">
                            {REACTION_EMOJIS[reaction.reactionType]}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">
                            {reaction.user.name}
                          </p>
                          {reaction.user.verified && (
                            <svg
                              className="h-4 w-4 text-primary flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{reaction.user.username}
                        </p>
                      </div>
                    </div>

                    {!isOwnProfile && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          handleFollowToggle(reaction.user.id, isFollowing)
                        }
                        disabled={
                          followMutation.isPending || unfollowMutation.isPending
                        }
                        className={cn(
                          "ml-2 group transition-all duration-200",
                          isFollowing &&
                            "hover:bg-destructive hover:text-white hover:border-destructive"
                        )}
                      >
                        {isFollowing ? (
                          <>
                            <span className="group-hover:hidden">
                              Following
                            </span>
                            <span className="hidden group-hover:inline">
                              Unfollow
                            </span>
                          </>
                        ) : (
                          "Follow"
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
