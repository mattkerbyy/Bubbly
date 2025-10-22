import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  UserPlus,
  X,
  Share2,
  ThumbsUp,
  Laugh,
  Frown,
  Angry,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMarkAsRead, useDeleteNotification } from "@/hooks/NotifFeature/useNotifications";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function NotificationItem({ notification, onClose }) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();

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

  const getNotificationIcon = () => {
    const type = notification.type;
    const reactionType = notification.reactionType;
    if (type === "reaction" || type === "like") {
      switch (reactionType?.toLowerCase()) {
        case "like":
          return (
            <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">
              👍
            </div>
          );
        case "love":
        case "heart":
          return (
            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px]">
              ❤️
            </div>
          );
        case "haha":
        case "laugh":
        case "laughing":
          return (
            <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px]">
              😂
            </div>
          );
        case "wow":
          return (
            <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px]">
              😮
            </div>
          );
        case "sad":
          return (
            <div className="h-4 w-4 rounded-full bg-gray-500 flex items-center justify-center text-[10px]">
              😢
            </div>
          );
        case "angry":
          return (
            <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px]">
              😠
            </div>
          );
        default:
          return (
            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px]">
              ❤️
            </div>
          );
      }
    }

    switch (type) {
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = () => {
    const senderName =
      notification.sender?.name || notification.sender?.username || "Someone";
    const type = notification.type;
    const reactionType = notification.reactionType;
    if (type === "reaction" || type === "like") {
      const reactionText = reactionType
        ? reactionType.charAt(0).toUpperCase() +
          reactionType.slice(1).toLowerCase()
        : "Like";

      return (
        <>
          <span className="font-semibold">{senderName}</span> reacted{" "}
          {reactionText} to your post
        </>
      );
    }

    switch (type) {
      case "comment":
        return (
          <>
            <span className="font-semibold">{senderName}</span> commented on
            your post
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-semibold">{senderName}</span> started
            following you
          </>
        );
      case "share":
        return (
          <>
            <span className="font-semibold">{senderName}</span> shared your post
          </>
        );
      default:
        return notification.content;
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.type === "follow") {
      navigate(`/profile/${notification.sender?.username}`);
    } else if (notification.shareId) {
      navigate(`/share/${notification.shareId}`);
    } else if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    }
    onClose?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`group relative flex items-start gap-2.5 md:gap-3 p-3 md:p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      onClick={handleClick}
    >
      {/* Avatar with Icon */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9 md:h-10 md:w-10">
          <AvatarImage src={getImageUrl(notification.sender?.avatar)} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs md:text-sm">
            {getInitials(notification.sender?.name)}
          </AvatarFallback>
        </Avatar>
        {/* Type Icon */}
        <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 bg-background rounded-full p-0.5 border border-border">
          {getNotificationIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8 md:pr-0">
        <p className="text-sm text-foreground leading-relaxed">
          {getNotificationText()}
        </p>

        {/* Post Preview (for likes and comments) */}
        {notification.post && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {notification.post.content}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 md:group-hover:opacity-100 transition-all hover:bg-destructive/15 hover:text-destructive hover:rotate-90 duration-300 touch-manipulation active:opacity-100"
        onClick={handleDelete}
        disabled={deleteNotificationMutation.isPending}
        title="Remove notification"
      >
        <X className="h-3.5 w-3.5 stroke-[2.5]" />
      </Button>

      {/* Post Image Preview (for likes and comments) */}
      {notification.post?.image && (
        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden">
          <img
            src={getImageUrl(notification.post.image)}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  );
}
