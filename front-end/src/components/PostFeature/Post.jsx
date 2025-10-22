import { useState, forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDeletePost } from "@/hooks/PostFeature/usePosts";
import {
  useAddOrUpdateReaction,
  useRemoveReaction,
} from "@/hooks/ReactionFeature/useReactions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PostPreviewModal from "@/components/PostFeature/PostPreviewModal";
import EditPostModal from "@/components/EditFeature/EditPostModal";
import ReactionPicker from "@/components/ReactionFeature/ReactionPicker";
import ShareButton from "@/components/ShareFeature/ShareButton";
import { AudienceIcon } from "@/components/AudienceFeature/AudienceSelector";
import ReactionsModal from "@/components/ReactionFeature/ReactionsModal";
import LikesList from "@/components/ReactionFeature/LikesList";
import ShareListModal from "@/components/ShareFeature/ShareListModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

const Post = forwardRef(({ post, isEmbedded = false }, ref) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const deletePostMutation = useDeletePost();
  const addOrUpdateReactionMutation = useAddOrUpdateReaction();
  const removeReactionMutation = useRemoveReaction();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [isShareListOpen, setIsShareListOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPostPreview, setShowPostPreview] = useState(false);
  const getUserReaction = (postData) => {
    if (!postData) return null;
    return postData.userReaction || null;
  };

  const [userReaction, setUserReaction] = useState(getUserReaction(post));
  const [reactionCount, setReactionCount] = useState(
    post._count?.reactions || 0
  );

  const isOwnPost = user?.id === post.user.id;
  useEffect(() => {
    const newReaction = getUserReaction(post);
    const newCount = post._count?.reactions || 0;
    setUserReaction(newReaction);
    setReactionCount(newCount);
  }, [post, user?.id]); // Depend on post and current user to catch all changes

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  const getFileType = (filename) => {
    if (!filename) return null;
    const ext = filename.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) {
      return "image";
    } else if (
      ["mp4", "mov", "avi", "wmv", "flv", "mkv", "webm"].includes(ext)
    ) {
      return "video";
    } else if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) {
      return "audio";
    } else if (
      ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(ext)
    ) {
      return "document";
    }
    return "file";
  };

  const getFileIcon = (type, filename) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-8 w-8" />;
      case "video":
        return <VideoIcon className="h-8 w-8" />;
      case "audio":
        return <Music className="h-8 w-8" />;
      case "document":
        return <FileText className="h-8 w-8" />;
      default:
        return <FileText className="h-8 w-8" />;
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      setShowDeleteDialog(false);
    } catch (error) {
    }
  };

  const handleReaction = async (reactionType) => {
    if (userReaction === reactionType) {
      const previousReaction = userReaction;
      const previousCount = reactionCount;
      setUserReaction(null);
      setReactionCount(Math.max(reactionCount - 1, 0));

      try {
        await removeReactionMutation.mutateAsync(post.id);
      } catch (error) {
        setUserReaction(previousReaction);
        setReactionCount(previousCount);
      }
    } else {
      const previousReaction = userReaction;
      const previousCount = reactionCount;
      setUserReaction(reactionType);
      setReactionCount(userReaction ? reactionCount : reactionCount + 1);

      try {
        await addOrUpdateReactionMutation.mutateAsync({
          postId: post.id,
          reactionType,
        });
      } catch (error) {
        setUserReaction(previousReaction);
        setReactionCount(previousCount);
      }
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const renderContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={i}
            className="text-primary hover:underline cursor-pointer font-medium"
          >
            {part}
          </span>
        );
      }
      if (part.match(/^https?:\/\//)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {part}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={
            isEmbedded
              ? "border-0 shadow-none"
              : "hover:shadow-md transition-shadow"
          }
        >
          <CardContent className={isEmbedded ? "p-4" : "p-6"}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() =>
                  !isEmbedded && navigate(`/profile/${post.user.username}`)
                }
              >
                <Avatar className={isEmbedded ? "h-10 w-10" : "h-12 w-12"}>
                  <AvatarImage src={getImageUrl(post.user.avatar)} />
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(post.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p
                    className={`font-semibold text-foreground ${
                      !isEmbedded && "hover:underline"
                    }`}
                  >
                    {post.user.name || "Unknown User"}
                  </p>
                  <div
                    className={`flex items-center gap-2 ${
                      isEmbedded ? "text-xs" : "text-sm"
                    } text-muted-foreground`}
                  >
                    <span>@{post.user.username}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                    {post.audience && (
                      <>
                        <span>•</span>
                        <AudienceIcon audience={post.audience} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isEmbedded && isOwnPost && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!isEmbedded && !isOwnPost && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            <div className="space-y-4">
              {post.content && (
                <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {renderContent(post.content)}
                </p>
              )}

              {/* File/Media Display - Show all files from files array */}
              {post.files && post.files.length > 0 && (
                <div className={post.files.length > 1 ? "space-y-2" : ""}>
                  {post.files.map((filePath, index) => {
                    const fileType = getFileType(filePath);
                    const fileUrl = getImageUrl(filePath);
                    const fileName = filePath.split("/").pop();
                    const originalFileName = fileName.replace(
                      /-\d+-\d+(\.[^.]+)$/,
                      "$1"
                    );

                    if (fileType === "image") {
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="rounded-lg overflow-hidden border border-border cursor-pointer group"
                          onClick={(e) => {
                            if (isEmbedded) e.stopPropagation();
                            setShowPostPreview(true);
                          }}
                        >
                          <img
                            src={fileUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full max-h-[500px] object-contain bg-muted group-hover:opacity-95 transition-opacity"
                            loading="lazy"
                            onError={() => setImageError(true)}
                          />
                        </motion.div>
                      );
                    } else if (fileType === "video") {
                      return (
                        <div
                          key={index}
                          className="rounded-lg overflow-hidden border border-border"
                        >
                          <video
                            src={fileUrl}
                            controls
                            className="w-full max-h-[500px] bg-black"
                            onError={() => setImageError(true)}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    } else if (fileType === "audio") {
                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-border p-4 bg-muted"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-primary">
                              {getFileIcon(fileType, filePath)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {originalFileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Audio file
                              </p>
                            </div>
                          </div>
                          <audio
                            src={fileUrl}
                            controls
                            className="w-full"
                            onError={() => setImageError(true)}
                          >
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      );
                    } else {
                      return (
                        <a
                          key={index}
                          href={fileUrl}
                          download={originalFileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-border p-4 bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-primary">
                              {getFileIcon(fileType, filePath)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {originalFileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to download
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </a>
                      );
                    }
                  })}
                </div>
              )}

              {/* Show error if no files but file field exists */}
              {!post.files && post.file && imageError && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center p-6">
                  <div className="text-sm text-muted-foreground">
                    File unavailable
                  </div>
                </div>
              )}

              {/* Engagement stats - Facebook style */}
              {!isEmbedded &&
                (reactionCount > 0 ||
                  post._count?.comments > 0 ||
                  post._count?.shares > 0) && (
                  <div className="flex items-center justify-between pt-3 pb-2">
                    {/* Reactions with avatars */}
                    <LikesList
                      postId={post.id}
                      likeCount={reactionCount}
                      userReaction={userReaction}
                      onViewAll={() => setShowReactionsModal(true)}
                    />

                    {/* Comments and shares count on the right */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                      {post._count?.comments > 0 && (
                        <button
                          onClick={() => setShowPostPreview(true)}
                          className="hover:underline"
                        >
                          {post._count.comments}{" "}
                          {post._count.comments === 1 ? "comment" : "comments"}
                        </button>
                      )}
                      {post._count?.shares > 0 && (
                        <button
                          onClick={() => setIsShareListOpen(true)}
                          className="hover:underline"
                        >
                          {post._count.shares}{" "}
                          {post._count.shares === 1 ? "share" : "shares"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Action Buttons - Hidden when embedded */}
              {!isEmbedded && (
                <div className="flex items-center justify-around pt-2 border-t border-border">
                  <ReactionPicker
                    postId={post.id}
                    currentReaction={userReaction}
                    onReactionChange={handleReaction}
                    disabled={
                      addOrUpdateReactionMutation.isPending ||
                      removeReactionMutation.isPending
                    }
                    wrapperClassName="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPostPreview(true)}
                    className="flex-1 gap-2 text-muted-foreground hover:text-primary"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">Comment</span>
                  </Button>

                  <ShareButton post={post} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post preview modal - Only show when not embedded */}
      {!isEmbedded && (
        <PostPreviewModal
          isOpen={showPostPreview}
          post={post}
          onClose={() => setShowPostPreview(false)}
        />
      )}

      {/* Edit post modal - Only show when not embedded */}
      {!isEmbedded && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Reactions modal - Only show when not embedded */}
      {!isEmbedded && (
        <ReactionsModal
          postId={post.id}
          isOpen={showReactionsModal}
          onClose={() => setShowReactionsModal(false)}
        />
      )}

      {/* Share list modal - Only show when not embedded */}
      {!isEmbedded && (
        <ShareListModal
          postId={post.id}
          isOpen={isShareListOpen}
          onClose={() => setIsShareListOpen(false)}
        />
      )}
    </>
  );
});

Post.displayName = "Post";

export default Post;
