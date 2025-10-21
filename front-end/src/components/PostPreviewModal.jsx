import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  X,
  MessageCircle,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Eye,
  Edit,
  FileText,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { useAddOrUpdateReaction, useRemoveReaction } from '@/hooks/useReactions'
import { usePostComments } from '@/hooks/useComments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'
import EditPostModal from '@/components/EditPostModal'
import ReactionPicker from '@/components/ReactionPicker'
import ShareButton from '@/components/ShareButton'
import LikesList from '@/components/LikesList'
import ReactionsModal from '@/components/ReactionsModal'
import ShareListModal from '@/components/ShareListModal'
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
  const addOrUpdateReactionMutation = useAddOrUpdateReaction()
  const removeReactionMutation = useRemoveReaction()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [isShareListOpen, setIsShareListOpen] = useState(false)
  // userReaction is now a string (reactionType) from backend, not an object
  const [userReaction, setUserReaction] = useState(post?.userReaction || null)
  const [reactionCount, setReactionCount] = useState(post?._count?.reactions || 0)
  const [commentCount, setCommentCount] = useState(post?._count?.comments || 0)
  const [shareCount, setShareCount] = useState(post?._count?.shares || 0)
  const [editingComment, setEditingComment] = useState(null)
  const commentSectionRef = useRef(null)

  const isOwnPost = user?.id === post?.user?.id

  // Fetch comments for this post
  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = usePostComments(post?.id, { enabled: isOpen && !!post?.id })

  const comments = commentsData?.comments || []
  const totalComments = comments.length

  // Update reaction status when post changes
  useEffect(() => {
    if (post) {
      // Backend now returns userReaction as a string directly
      setUserReaction(post.userReaction || null)
      setReactionCount(post._count?.reactions || 0)
      setCommentCount(post._count?.comments || 0)
      setShareCount(post._count?.shares || 0)
    }
    // We intentionally omit comments dependency to avoid loop; comment count sync handled separately
  }, [post])

  useEffect(() => {
    setCommentCount(totalComments)
  }, [totalComments])

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
  // Delete post error handled by UI
    }
  }

  const handleReaction = async (reactionType) => {
    if (!post?.id) return

    if (userReaction === reactionType) {
      const previousReaction = userReaction
      const previousCount = reactionCount

      setUserReaction(null)
      setReactionCount(Math.max(reactionCount - 1, 0))

      try {
        await removeReactionMutation.mutateAsync(post.id)
      } catch (error) {
        setUserReaction(previousReaction)
        setReactionCount(previousCount)
      }
    } else {
      const previousReaction = userReaction
      const previousCount = reactionCount

      setUserReaction(reactionType)
      setReactionCount(userReaction ? reactionCount : reactionCount + 1)

      try {
        await addOrUpdateReactionMutation.mutateAsync({ postId: post.id, reactionType })
      } catch (error) {
        setUserReaction(previousReaction)
        setReactionCount(previousCount)
      }
    }
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment)
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
  }

  const handleCommentFocus = () => {
    if (!commentSectionRef.current) return

    commentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const textarea = commentSectionRef.current.querySelector('textarea')
    if (textarea) {
      setTimeout(() => textarea.focus(), 150)
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
          style={{ margin: 0, padding: 0, overflow: 'hidden' }}
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
            <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
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
              {(reactionCount > 0 || commentCount > 0 || shareCount > 0) && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex-1">
                      {reactionCount > 0 && (
                        <LikesList
                          postId={post.id}
                          likeCount={reactionCount}
                          userReaction={userReaction}
                          onViewAll={() => setShowReactionsModal(true)}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {commentCount > 0 && (
                        <button
                          type="button"
                          onClick={handleCommentFocus}
                          className="hover:underline"
                        >
                          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                        </button>
                      )}
                      {shareCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsShareListOpen(true)}
                          className="hover:underline"
                        >
                          {shareCount} {shareCount === 1 ? 'share' : 'shares'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-around p-2">
                <ReactionPicker
                  postId={post.id}
                  currentReaction={userReaction}
                  onReactionChange={handleReaction}
                  disabled={addOrUpdateReactionMutation.isPending || removeReactionMutation.isPending}
                  wrapperClassName="flex-1"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary"
                  onClick={handleCommentFocus}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Comment</span>
                </Button>

                <ShareButton post={post} className="flex-1" />
              </div>

              <Separator />

              {/* Comments Section */}
              <div ref={commentSectionRef} className="p-4 space-y-4">
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

      <ReactionsModal
        postId={post?.id}
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
      />

      <ShareListModal
        isOpen={isShareListOpen}
        onClose={() => setIsShareListOpen(false)}
        postId={post?.id}
      />
    </AnimatePresence>
  )
}
