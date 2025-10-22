import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPostReactions } from "@/services/ReactionFeature/reactionService";
import { getShareReactions } from "@/services/ShareFeature/shareReactionService";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

export default function LikesList({
  postId,
  shareId,
  likeCount,
  userReaction,
  onViewAll,
  isShare = false,
}) {
  const [topReactions, setTopReactions] = useState([]);
  const [dominantReaction, setDominantReaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const entityId = isShare ? shareId : postId;

  useEffect(() => {
    if (entityId && likeCount > 0) {
      fetchTopReactions();
    } else {
      setTopReactions([]);
      setDominantReaction(null);
    }
  }, [entityId, likeCount, userReaction, isShare]); // Add isShare to trigger refetch

  const fetchTopReactions = async () => {
    setIsLoading(true);
    try {
      const data = isShare
        ? await getShareReactions(shareId, 1, 20)
        : await getPostReactions(postId, 1, 20);
      const reactions = data.reactions || [];
      if (reactions.length === 1 && userReaction) {
        setDominantReaction(userReaction);
        setTopReactions(reactions.slice(0, 3));
        setIsLoading(false);
        return;
      }
      const reactionCounts = {};
      reactions.forEach((reaction) => {
        const type = reaction.reactionType;
        reactionCounts[type] = (reactionCounts[type] || 0) + 1;
      });
      let maxCount = 0;
      let mostCommon = userReaction || "Heart"; // Use userReaction as fallback instead of Heart
      Object.entries(reactionCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = type;
        }
      });

      setDominantReaction(mostCommon);
      setTopReactions(reactions.slice(0, 3));
    } catch (err) {
      setDominantReaction(userReaction || "Heart");
    } finally {
      setIsLoading(false);
    }
  };

  const getReactionIcon = (reactionType) => {
    switch (reactionType) {
      case "Like":
        return <span className="text-[10px]">👍</span>;
      case "Heart":
        return <span className="text-[10px]">❤️</span>;
      case "Laughing":
        return <span className="text-[10px]">😂</span>;
      case "Wow":
        return <span className="text-[10px]">😮</span>;
      case "Sad":
        return <span className="text-[10px]">😢</span>;
      case "Angry":
        return <span className="text-[10px]">😠</span>;
      default:
        return <span className="text-[10px]">❤️</span>;
    }
  };

  const getReactionColor = (reactionType) => {
    switch (reactionType) {
      case "Like":
        return "bg-blue-500";
      case "Heart":
        return "bg-red-500";
      case "Laughing":
        return "bg-yellow-500";
      case "Wow":
        return "bg-yellow-500";
      case "Sad":
        return "bg-gray-500";
      case "Angry":
        return "bg-orange-500";
      default:
        return "bg-red-500";
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

  if (likeCount === 0) return null;

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:underline group"
      onClick={onViewAll}
    >
      {/* Reaction icon in circle - shows dominant reaction type */}
      <div className="flex -space-x-1">
        <div
          className={`h-5 w-5 rounded-full ${getReactionColor(
            dominantReaction || "Heart"
          )} flex items-center justify-center border-2 border-background z-10`}
        >
          {getReactionIcon(dominantReaction || "Heart")}
        </div>

        {/* Top reactor avatars */}
        {!isLoading &&
          topReactions.slice(0, 3).map((reaction, index) => (
            <Avatar
              key={reaction.user.id}
              className="h-5 w-5 border-2 border-background"
              style={{ zIndex: 9 - index }}
            >
              <AvatarImage src={getImageUrl(reaction.user.avatar)} />
              <AvatarFallback className="bg-primary text-white text-[8px]">
                {getInitials(reaction.user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
      </div>

      {/* Names and count */}
      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {isLoading ? (
          <span>{likeCount}</span>
        ) : topReactions.length > 0 ? (
          <span>
            {topReactions.slice(0, 2).map((reaction, index) => (
              <span key={reaction.user.id}>
                {index > 0 && ", "}
                <span className="font-medium text-foreground">
                  {reaction.user.name}
                </span>
              </span>
            ))}
            {likeCount > 2 && (
              <span>
                {" "}
                and {likeCount - 2} other{likeCount - 2 !== 1 ? "s" : ""}
              </span>
            )}
            {likeCount <= 2 && topReactions.length === likeCount && (
              <span></span>
            )}
          </span>
        ) : (
          <span>{likeCount}</span>
        )}
      </div>
    </div>
  );
}
