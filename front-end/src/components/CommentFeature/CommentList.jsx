import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useAuthStore } from "@/stores/useAuthStore";
import { useDeleteComment } from "@/hooks/CommentFeature/useComments";
import { useDeleteShareComment } from "@/hooks/ShareFeature/useShareComments";
import CommentSkeleton from "@/components/skeletons/CommentFeature/CommentSkeleton";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

function CommentItem({ comment, onEdit, postOwnerId, shareId, shareOwnerId }) {
  const { user } = useAuthStore();
  const deleteCommentMutation = useDeleteComment();
  const deleteShareCommentMutation = useDeleteShareComment();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isShareContext = !!shareId;
  const isDeleting = isShareContext
    ? deleteShareCommentMutation.isPending
    : deleteCommentMutation.isPending;

  const isOwnComment = user?.id === comment.user.id;
  const ownerId = isShareContext ? shareOwnerId : postOwnerId;
  const isOwner = ownerId ? user?.id === ownerId : false;
  const canDelete = isOwnComment || isOwner;
  const canEdit = isOwnComment;

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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handleDelete = async () => {
    try {
      if (isShareContext) {
        await deleteShareCommentMutation.mutateAsync({
          commentId: comment.id,
          shareId,
        });
      } else {
        await deleteCommentMutation.mutateAsync({
          commentId: comment.id,
          postId: comment.postId || comment.post?.id,
        });
      }
      setShowDeleteDialog(false);
    } catch (error) {
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex gap-2 group"
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getImageUrl(comment.user?.avatar)} />
          <AvatarFallback className="bg-primary text-white text-xs">
            {getInitials(comment.user?.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-2xl px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm text-foreground">
                {comment.user?.name || "Unknown User"}
              </p>
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[10003]">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit?.(comment)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 px-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[10004]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CommentList({
  comments,
  onEdit,
  isLoading,
  postOwnerId,
  shareId,
  shareOwnerId,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>No comments yet</p>
        <p className="text-xs mt-1">Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onEdit={onEdit}
            postOwnerId={postOwnerId}
            shareId={shareId}
            shareOwnerId={shareOwnerId}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
