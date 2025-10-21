import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Repeat2, MessageCircle, MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDeleteShare } from '@/hooks/usePosts'
import { useAddShareReaction, useRemoveShareReaction } from '@/hooks/useShareReactions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Post from '@/components/Post'
import EditShareModal from '@/components/EditShareModal'
import ReactionPicker from '@/components/ReactionPicker'
import ShareButton from '@/components/ShareButton'
import SharePreviewModal from '@/components/SharePreviewModal'
import PostPreviewModal from '@/components/PostPreviewModal'
import LikesList from '@/components/LikesList'
import ReactionsModal from '@/components/ReactionsModal'
import ShareListModal from '@/components/ShareListModal'
import { AudienceIcon } from '@/components/AudienceSelector'
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

// Ensure we have the backend origin
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function SharedPost({ share, showActions = true }) {
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [isShareListOpen, setIsShareListOpen] = useState(false)
  const [showEmbeddedPostPreview, setShowEmbeddedPostPreview] = useState(false)
  const deleteShareMutation = useDeleteShare()
  const addShareReactionMutation = useAddShareReaction()
  const removeShareReactionMutation = useRemoveShareReaction()
  
  // userReaction is now a string (reactionType) from backend, not an object
  const getUserReaction = (shareData) => {
    if (!shareData) return null
    // Backend now returns userReaction as a string directly
    return shareData.userReaction || null
  }

  const [userReaction, setUserReaction] = useState(getUserReaction(share))
  const [reactionCount, setReactionCount] = useState(share._count?.reactions || 0)
  const [commentCount] = useState(share._count?.comments || 0)
  const [shareCount, setShareCount] = useState(share.post?._count?.shares || 0)

  // Extract share information
  const { id: shareId, post, user, shareCaption, createdAt } = share
  
  // Sync reaction state when share prop changes
  useEffect(() => {
    const newReaction = getUserReaction(share)
    const newCount = share._count?.reactions || 0
    
    setUserReaction(newReaction)
    setReactionCount(newCount)
    setShareCount(share.post?._count?.shares || 0)
  }, [share, currentUser?.id])
  
  // Handle missing data
  if (!post || !user) {
    return null
  }

  const isOwnShare = currentUser?.id === user.id

  const avatarUrl = user.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${API_URL}${user.avatar}`
    : null

  const handleUserClick = (e) => {
    e.stopPropagation()
    navigate(`/profile/${user.username}`)
  }

  const getUserInitials = (name) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleDelete = async () => {
    try {
      if (post?.id) {
        await deleteShareMutation.mutateAsync(post.id)
      }
      setShowDeleteDialog(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleViewOriginal = () => {
    if (post?.id) {
      navigate(`/post/${post.id}`)
    }
  }

  const handleReaction = async (reactionType) => {
    if (userReaction === reactionType) {
      const previousReaction = userReaction
      const previousCount = reactionCount
      
      setUserReaction(null)
      setReactionCount(Math.max(reactionCount - 1, 0))

      try {
        await removeShareReactionMutation.mutateAsync(shareId)
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
        await addShareReactionMutation.mutateAsync({ shareId, reactionType })
      } catch (error) {
        setUserReaction(previousReaction)
        setReactionCount(previousCount)
      }
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            {/* Share Header - Who shared it */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar
                  className="h-10 w-10 cursor-pointer ring-2 ring-background hover:ring-primary/50 transition-all"
                  onClick={handleUserClick}
                >
                  {!imageError && avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={user.name}
                      onError={() => setImageError(true)}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUserClick}
                      className="font-semibold hover:underline truncate"
                    >
                      {user.name}
                    </button>
                    {user.verified && (
                      <svg
                        className="h-4 w-4 text-primary flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">@{user.username}</span>
                    <span>•</span>
                    <span className="flex-shrink-0">
                      {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </span>
                    {share.audience && (
                      <>
                        <span>•</span>
                        <AudienceIcon audience={share.audience} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Share badge + 3-dot menu */}
              <div className="flex items-center gap-2">
                {/* Share Icon Badge */}
                <div className="flex items-center gap-1.5 text-primary">
                  <Repeat2 className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Shared</span>
                </div>

                {/* 3-dot menu for own shares */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[180px]">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleViewOriginal()
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View original post
                    </DropdownMenuItem>
                    {isOwnShare && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation()
                            setShowEditModal(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit caption
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation()
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete share
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Share Caption */}
            {shareCaption && (
              <div className="mb-4 text-foreground">
                <p className="whitespace-pre-wrap break-words">{shareCaption}</p>
              </div>
            )}

            {/* Original Post */}
            <div
              className="mb-4 border-2 border-border rounded-lg overflow-hidden bg-muted/30 cursor-pointer transition-colors hover:border-primary"
              onClick={(event) => {
                // Check if click target is an image or inside an image container
                const target = event.target
                const isImageClick = target.tagName === 'IMG' || target.closest('img')
                
                if (isImageClick) {
                  event.stopPropagation()
                  setShowEmbeddedPostPreview(true)
                } else {
                  event.stopPropagation()
                  navigate(`/post/${post.id}`)
                }
              }}
            >
              <Post post={post} isEmbedded={true} />
            </div>

            {/* Engagement Stats */}
            {(reactionCount > 0 || commentCount > 0 || shareCount > 0) && (
              <div className="flex items-center justify-between pt-3 pb-2">
                {/* Reactions with avatars - same as Post */}
                <LikesList
                  shareId={shareId}
                  likeCount={reactionCount}
                  userReaction={userReaction}
                  onViewAll={() => setShowReactionsModal(true)}
                  isShare={true}
                />
                
                {/* Comments and shares count on the right */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                  {commentCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCommentsOpen(true)}
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
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="flex items-center justify-around pt-2 border-t border-border">
                <ReactionPicker
                  postId={shareId}
                  currentReaction={userReaction}
                  onReactionChange={handleReaction}
                  disabled={addShareReactionMutation.isPending || removeShareReactionMutation.isPending}
                  isShare={true}
                  wrapperClassName="flex-1"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCommentsOpen(true)}
                  className="flex-1 gap-2 text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Comment</span>
                </Button>

                <ShareButton post={post} className="flex-1" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <EditShareModal
        share={share}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete share?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this shared post from your profile. The original post will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteShareMutation.isPending}
            >
              {deleteShareMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showActions && (
        <>
          <SharePreviewModal
            isOpen={isCommentsOpen}
            share={share}
            onClose={() => setIsCommentsOpen(false)}
          />
          
          <ReactionsModal
            shareId={shareId}
            isOpen={showReactionsModal}
            onClose={() => setShowReactionsModal(false)}
            isShare={true}
          />

          <ShareListModal
            postId={post.id}
            isOpen={isShareListOpen}
            onClose={() => setIsShareListOpen(false)}
          />

          {/* Embedded Post Preview Modal - for clicking images in embedded post */}
          <PostPreviewModal
            isOpen={showEmbeddedPostPreview}
            post={post}
            onClose={() => setShowEmbeddedPostPreview(false)}
          />
        </>
      )}
    </>
  )
}
