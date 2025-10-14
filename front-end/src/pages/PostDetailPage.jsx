import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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

                {/* Image */}
                {post.image && !imageError && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={getImageUrl(post.image)}
                      alt="Post image"
                      className="w-full max-h-[600px] object-cover"
                      loading="lazy"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={toggleLikeMutation.isPending}
                    className={`gap-2 transition-colors ${
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
                    <span className="text-sm font-medium">{likeCount}</span>
                  </Button>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{comments.length}</span>
                  </div>

                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                    <Share2 className="h-5 w-5" />
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
    </div>
  )
}
