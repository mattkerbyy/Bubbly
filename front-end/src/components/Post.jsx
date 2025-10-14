import { useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, ExternalLink, Eye, FileText, Music, Video as VideoIcon, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { useToggleLike } from '@/hooks/useLikes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PostPreviewModal from '@/components/PostPreviewModal'
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

// Ensure we have the backend origin (strip a trailing '/api' if developer set VITE_API_URL to include it)
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

const Post = forwardRef(({ post }, ref) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const deletePostMutation = useDeletePost()
  const toggleLikeMutation = useToggleLike()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPostPreview, setShowPostPreview] = useState(false)
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)

  const isOwnPost = user?.id === post.user.id

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

  const getFileIcon = (type, filename) => {
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

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    
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
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/profile/${post.user.username}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getImageUrl(post.user.avatar)} />
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(post.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground hover:underline">
                    {post.user.name || 'Unknown User'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{post.user.username}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              {isOwnPost && (
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

              {!isOwnPost && (
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
                    const fileType = getFileType(filePath)
                    const fileUrl = getImageUrl(filePath)
                    const fileName = filePath.split('/').pop()
                    
                    // Extract original filename by removing timestamp-random suffix
                    // Format: "filename-MMDDYYYY-random.ext" → "filename.ext"
                    const originalFileName = fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1')

                    if (fileType === 'image') {
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="rounded-lg overflow-hidden border border-border cursor-pointer group"
                          onClick={() => setShowPostPreview(true)}
                        >
                          <img
                            src={fileUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full max-h-[500px] object-contain bg-muted group-hover:opacity-95 transition-opacity"
                            loading="lazy"
                            onError={() => setImageError(true)}
                          />
                        </motion.div>
                      )
                    } else if (fileType === 'video') {
                      return (
                        <div key={index} className="rounded-lg overflow-hidden border border-border">
                          <video
                            src={fileUrl}
                            controls
                            className="w-full max-h-[500px] bg-black"
                            onError={() => setImageError(true)}
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
                              {getFileIcon(fileType, filePath)}
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
                            onError={() => setImageError(true)}
                          >
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )
                    } else {
                      // Document or unknown file type
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
                      )
                    }
                  })}
                </div>
              )}

              {/* Show error if no files but file field exists */}
              {!post.files && post.file && imageError && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center p-6">
                  <div className="text-sm text-muted-foreground">File unavailable</div>
                </div>
              )}

              {/* Engagement stats - Facebook style */}
              {(likeCount > 0 || post._count?.comments > 0) && (
                <div className="flex items-center justify-between pt-3 pb-2">
                  {/* Likes with avatars */}
                  <LikesList
                    postId={post.id}
                    likeCount={likeCount}
                    onViewAll={() => setShowLikesModal(true)}
                  />
                  
                  {/* Comments count */}
                  {post._count?.comments > 0 && (
                    <button
                      onClick={() => setShowPostPreview(true)}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-around pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={toggleLikeMutation.isPending}
                  className={`flex-1 gap-2 transition-colors ${
                    isLiked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <motion.div
                    key={isLiked ? 'liked' : 'unliked'}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`}
                    />
                  </motion.div>
                  <span className="font-medium">Like</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPostPreview(true)}
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Comment</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="font-medium">Share</span>
                </Button>
              </div>
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

      {/* Post preview modal */}
      <PostPreviewModal
        isOpen={showPostPreview}
        post={post}
        onClose={() => setShowPostPreview(false)}
      />

      {/* Edit post modal */}
      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Likes modal */}
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </>
  )
})

Post.displayName = 'Post'

export default Post