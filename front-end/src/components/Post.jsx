import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeletePost } from '@/hooks/usePosts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PostPreviewModal from '@/components/PostPreviewModal'
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

// Ensure we have the backend origin (strip a trailing '/api' if developer set VITE_API_URL to include it)
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function Post({ post }) {
  const { user } = useAuthStore()
  const deletePostMutation = useDeletePost()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPostPreview, setShowPostPreview] = useState(false)

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

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete post:', error)
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getImageUrl(post.user.avatar)} />
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(post.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground hover:underline cursor-pointer">
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
                <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {renderContent(post.content)}
                </p>
              )}

              {/* Image */}
              {post.image && !imageError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg overflow-hidden border border-border cursor-pointer group"
                  onClick={() => setShowPostPreview(true)}
                >
                  <img
                    src={getImageUrl(post.image)}
                    alt="Post image"
                    className="w-full max-h-[500px] object-cover group-hover:opacity-95 transition-opacity"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                </motion.div>
              )}

              {post.image && imageError && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center p-6">
                  <div className="text-sm text-muted-foreground">Image unavailable</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {post._count?.likes || 0}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {post._count?.comments || 0}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-5 w-5" />
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
    </>
  )
}
