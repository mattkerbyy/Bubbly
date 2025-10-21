import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getPostLikes } from '@/services/likeService'
import { useFollowUser, useUnfollowUser } from '@/hooks/useFollow'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { LikesModalSkeleton } from '@/components/skeletons/LikesModalSkeleton'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

export default function LikesModal({ postId, isOpen, onClose }) {
  const [likes, setLikes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user: currentUser } = useAuthStore()
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes()
    }
  }, [isOpen, postId])

  const fetchLikes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPostLikes(postId)
      setLikes(data.likes || [])
    } catch (err) {
      setError('Failed to load likes')
  // Error fetching likes handled by UI
    } finally {
      setIsLoading(false)
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(userId)
        // Update local state
        setLikes(likes.map(like =>
          like.user.id === userId
            ? { ...like, user: { ...like.user, isFollowing: false } }
            : like
        ))
      } else {
        await followMutation.mutateAsync(userId)
        // Update local state
        setLikes(likes.map(like =>
          like.user.id === userId
            ? { ...like, user: { ...like.user, isFollowing: true } }
            : like
        ))
      }
    } catch (error) {
  // Error toggling follow handled by UI
    }
  }

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-0">
        <AlertDialogHeader className="border-b p-4 pb-3">
          <div className="flex items-center justify-between">
            <AlertDialogTitle>Likes</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </AlertDialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <LikesModalSkeleton count={5} />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLikes}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <p>No likes yet</p>
            </div>
          ) : (
            <div className="p-2">
              {likes.map((like) => {
                const isOwnProfile = currentUser?.id === like.user.id
                const isFollowing = like.user.isFollowing

                return (
                  <motion.div
                    key={like.user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(like.user.username)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getImageUrl(like.user.avatar)} />
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {getInitials(like.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">
                            {like.user.name}
                          </p>
                          {like.user.verified && (
                            <svg
                              className="h-4 w-4 text-primary flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{like.user.username}
                        </p>
                      </div>
                    </div>

                    {!isOwnProfile && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollowToggle(like.user.id, isFollowing)}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        className="ml-2"
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
