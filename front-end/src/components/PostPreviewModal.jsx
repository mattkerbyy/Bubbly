import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { X, Heart, MessageCircle, Share2, MoreHorizontal, ExternalLink, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

export default function PostPreviewModal({ isOpen, post, onClose }) {
  const { user } = useAuthStore()
  const deletePostMutation = useDeletePost()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isOwnPost = user?.id === post?.user?.id

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !post) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id)
      setShowDeleteDialog(false)
      onClose() // Close the modal after deletion
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const renderContent = (content) => {
    if (!content) return null
    
    // Simple hashtag and link detection
    const parts = content.split(/(\s+)/)
    return parts.map((part, i) => {
      // Hashtag
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-primary hover:underline cursor-pointer font-medium">
            {part}
          </span>
        )
      }
      // URL
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
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ margin: 0, padding: 0 }}
          onClick={handleBackdropClick}
        >
          {/* Modal Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[95vh] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getImageUrl(post.user?.avatar)} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {getInitials(post.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground hover:underline cursor-pointer truncate">
                    {post.user?.name || 'Unknown User'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{post.user?.username}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwnPost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[10001]">
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Post Content */}
              {post.content && (
                <div className="p-4">
                  <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {renderContent(post.content)}
                  </p>
                </div>
              )}

              {/* Image */}
              {post.image && (
                <div className="w-full">
                  <img
                    src={getImageUrl(post.image)}
                    alt="Post image"
                    className="w-full object-contain max-h-[500px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Engagement Stats */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                        <Heart className="h-3 w-3 text-white fill-white" />
                      </div>
                    </div>
                    <span className="ml-1 hover:underline cursor-pointer">
                      {post._count?.likes || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hover:underline cursor-pointer">
                      {post._count?.comments || 0} {post._count?.comments === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-around p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">Like</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Comment</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="font-medium">Share</span>
                </Button>
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Comment Example - Will be dynamic when comments are implemented */}
                  {post._count?.comments > 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      <p>Comments will appear here</p>
                      <p className="text-xs mt-1">(Phase 3: Likes & Comments coming soon)</p>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      <p>No comments yet</p>
                      <p className="text-xs mt-1">Be the first to comment!</p>
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex items-center gap-2 pt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-full px-4 py-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="z-[10002]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deletePostMutation.isPending}
                >
                  {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
