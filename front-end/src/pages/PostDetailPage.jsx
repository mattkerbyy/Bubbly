import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, FileText, Music, Video as VideoIcon, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { useToggleLike } from '@/hooks/useLikes'
import { usePostComments } from '@/hooks/useComments'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'
import EditPostModal from '@/components/EditPostModal'
import LikesModal from '@/components/LikesModal'
import LikesList from '@/components/LikesList'
import { PostSkeleton } from '@/components/skeletons/PostSkeleton'
import api from '@/lib/api'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

// Fetch single post by ID
const fetchPost = async (postId) => {
  const response = await api.get(`/posts/${postId}`)
  return response.data
}

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const deletePostMutation = useDeletePost()
  const toggleLikeMutation = useToggleLike()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  })

  const post = data?.data

  // Fetch comments for this post
  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = usePostComments(postId, { enabled: !!postId })

  const comments = commentsData?.comments || []

  // Update like status when post loads
  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false)
      setLikeCount(post._count?.likes || 0)
    }
  }, [post])

  const isOwnPost = user?.id === post?.user?.id

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const handleLike = async () => {
    const previousLiked = isLiked
    const previousCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      await toggleLikeMutation.mutateAsync(post.id)
      // Invalidate queries to sync across all pages
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked)
      setLikeCount(previousCount)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id)
      navigate('/home')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="flex h-16 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-bold text-lg">Post</h1>
            </div>
          </div>
        </div>
        
        <div className="container max-w-3xl mx-auto px-4 py-6">
          <PostSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="flex h-16 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-bold text-lg">Post</h1>
            </div>
          </div>
        </div>

        <div className="container max-w-3xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-6xl">😕</div>
            <h2 className="text-2xl font-bold text-foreground">Post Not Found</h2>
            <p className="text-muted-foreground">
              {error?.response?.data?.error || "This post doesn't exist or has been deleted."}
            </p>
            <Button onClick={() => navigate('/home')} variant="outline">
              Go Back Home
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Post</h1>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              {/* User Info */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
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
              </div>

              {/* Content */}
              <div className="space-y-4">
                {post.content && (
                  <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed text-lg">
                    {post.content}
                  </p>
                )}

                {/* File Display - Supporting images, videos, audio, and documents */}
                {post.files && post.files.length > 0 && (
                  <div className={post.files.length > 1 ? "space-y-3" : ""}>
                    {post.files.map((filePath, index) => {
                      const fileType = getFileType(filePath)
                      const fileUrl = getImageUrl(filePath)
                      const fileName = filePath.split('/').pop()
                      // Extract original filename by removing timestamp-random suffix
                      const originalFileName = fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1')

                      if (fileType === 'image') {
                        return (
                          <div key={index} className="rounded-lg overflow-hidden border border-border">
                            <img
                              src={fileUrl}
                              alt={`Post image ${index + 1}`}
                              className="w-full max-h-[600px] object-contain bg-muted"
                              loading="lazy"
                              onError={() => setImageError(true)}
                            />
                          </div>
                        )
                      } else if (fileType === 'video') {
                        return (
                          <div key={index} className="rounded-lg overflow-hidden border border-border bg-black">
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

                {/* Engagement stats - Facebook style */}
                {(likeCount > 0 || comments.length > 0) && (
                  <div className="flex items-center justify-between pt-3 pb-2">
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
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.div>
                    <span className="font-medium">Like</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
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

          {/* Comments Section */}
          <div className="mt-6">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Comments</h3>
                <Separator className="mb-4" />
                
                {/* Comment Input */}
                <CommentInput postId={post.id} />

                {/* Comments List */}
                <div className="mt-6">
                  <CommentList postId={post.id} comments={comments} isLoading={commentsLoading} />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

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

      {/* Edit post modal */}
      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Likes modal */}
      <LikesModal
        postId={post?.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </div>
  )
}
