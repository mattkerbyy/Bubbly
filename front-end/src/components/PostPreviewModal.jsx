import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { X, Heart, MessageCircle, Share2, MoreHorizontal, ExternalLink, Trash2, Eye, Edit, FileText, Music, Video as VideoIcon, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { useToggleLike } from '@/hooks/useLikes'
import { usePostComments } from '@/hooks/useComments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'
import EditPostModal from '@/components/EditPostModal'
import LikesModal from '@/components/LikesModal'
import LikesList from '@/components/LikesList'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  const navigate = useNavigate()
  const deletePostMutation = useDeletePost()
  const toggleLikeMutation = useToggleLike()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [isLiked, setIsLiked] = useState(post?.isLiked || false)
  const [likeCount, setLikeCount] = useState(post?._count?.likes || 0)
  const [editingComment, setEditingComment] = useState(null)

  const isOwnPost = user?.id === post?.user?.id

  // Fetch comments for this post
  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = usePostComments(post?.id, { enabled: isOpen && !!post?.id })

  const comments = commentsData?.comments || []

  // Update like status when post changes
  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false)
      setLikeCount(post._count?.likes || 0)
    }
  }, [post])

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

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      await toggleLikeMutation.mutateAsync(post.id)
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked)
      setLikeCount(likeCount)
      console.error('Failed to toggle like:', error)
    }
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment)
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
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

  const getFileType = (filename) => {
    if (!filename) return null
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'image'
    } else if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
      return 'video'
    } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return 'audio'
    } else if (['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return 'document'
    }
    return 'file'
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8" />
      case 'video':
        return <VideoIcon className="h-8 w-8" />
      case 'audio':
        return <Music className="h-8 w-8" />
      case 'document':
        return <FileText className="h-8 w-8" />
      default:
        return <FileText className="h-8 w-8" />
    }
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
                {isOwnPost ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[10001]">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          navigate(`/post/${post.id}`)
                          onClose()
                        }}
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
                ) : (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[10001]">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          navigate(`/post/${post.id}`)
                          onClose()
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all hover:rotate-90 duration-300"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4">
              {/* Post Content */}
              {post.content && (
                <div className="py-4">
                  <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {renderContent(post.content)}
                  </p>
                </div>
              )}

              {/* File Display - Supporting images, videos, audio, and documents */}
              {post.files && post.files.length > 0 && (
                <div className={post.files.length > 1 ? "space-y-2" : ""}>
                  {post.files.map((filePath, index) => {
                    const fileType = getFileType(filePath)
                    const fileUrl = getImageUrl(filePath)
                    const fileName = filePath.split('/').pop()
                    // Extract original filename by removing timestamp-random suffix
                    const originalFileName = fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1')

                    if (fileType === 'image') {
                      return (
                        <div key={index} className="w-full">
                          <img
                            src={fileUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full object-contain max-h-[600px] bg-muted"
                            loading="lazy"
                          />
                        </div>
                      )
                    } else if (fileType === 'video') {
                      return (
                        <div key={index} className="w-full bg-black">
                          <video
                            src={fileUrl}
                            controls
                            className="w-full max-h-[600px]"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )
                    } else if (fileType === 'audio') {
                      return (
                        <div key={index} className="rounded-lg border border-border p-4 bg-muted">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-primary">
                              <Music className="h-8 w-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {originalFileName}
                              </p>
                              <p className="text-xs text-muted-foreground">Audio file</p>
                            </div>
                          </div>
                          <audio
                            src={fileUrl}
                            controls
                            className="w-full"
                          >
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )
                    } else {
                      // Document or other file types
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
                              <FileText className="h-8 w-8" />
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
                      )
                    }
                  })}
                </div>
              )}

              {/* Engagement Stats - Facebook style */}
              {(likeCount > 0 || comments.length > 0) && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    {/* Likes with avatars */}
                    <LikesList
                      postId={post.id}
                      likeCount={likeCount}
                      onViewAll={() => setShowLikesModal(true)}
                    />
                    
                    {/* Comments count */}
                    {comments.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-around p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={toggleLikeMutation.isPending}
                  className={`flex-1 gap-2 transition-colors ${
                    isLiked
                      ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <motion.div
                    key={isLiked ? 'liked' : 'unliked'}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
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
              <div className="p-4 space-y-4">
                <CommentList
                  comments={comments}
                  onEdit={handleEditComment}
                  isLoading={commentsLoading}
                  postOwnerId={post.user.id}
                />

                {/* Comment Input */}
                <CommentInput
                  postId={post.id}
                  editingComment={editingComment}
                  onCancelEdit={handleCancelEdit}
                />
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

      {/* Edit post modal */}
      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Likes modal - render outside modal for proper z-index */}
      <LikesModal
        postId={post?.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </AnimatePresence>
  )
}
