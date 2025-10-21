import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactionPicker from '@/components/ReactionPicker'
import ShareButton from '@/components/ShareButton'
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'
import EditShareModal from '@/components/EditShareModal'
import Post from '@/components/Post'
import ShareListModal from '@/components/ShareListModal'
import LikesList from '@/components/LikesList'
import ReactionsModal from '@/components/ReactionsModal'
import { Separator } from '@/components/ui/separator'
import { useAddShareReaction, useRemoveShareReaction } from '@/hooks/useShareReactions'
import { useShareComments } from '@/hooks/useShareComments'
import { useDeleteShare } from '@/hooks/usePosts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import api from '@/lib/api'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

const fetchShare = async (shareId) => {
  const response = await api.get(`/shares/${shareId}`)
  return response.data.data
}

export default function SharePreviewModal({ isOpen, share, onClose }) {
  const shareId = share?.id
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [isShareListOpen, setIsShareListOpen] = useState(false)
  const commentSectionRef = useRef(null)

  const deleteShareMutation = useDeleteShare()
  const addShareReactionMutation = useAddShareReaction()
  const removeShareReactionMutation = useRemoveShareReaction()

  const {
    data: fetchedShare,
    isLoading: shareLoading,
    refetch: refetchShare,
  } = useQuery({
    queryKey: ['share', shareId],
    queryFn: () => fetchShare(shareId),
    enabled: isOpen && !!shareId,
    initialData: share,
    staleTime: 0,
  })

  const resolvedShare = fetchedShare || share

  // userReaction is now a string (reactionType) from backend, not an object
  const getUserReaction = (shareData) => {
    if (!shareData) return null
    // Backend now returns userReaction as a string directly
    return shareData.userReaction || null
  }

  const [userReaction, setUserReaction] = useState(getUserReaction(resolvedShare))
  const [reactionCount, setReactionCount] = useState(resolvedShare?._count?.reactions || 0)
  const [commentCount, setCommentCount] = useState(resolvedShare?._count?.comments || 0)
  const [shareCount, setShareCount] = useState(resolvedShare?.post?._count?.shares || 0)

  useEffect(() => {
    if (resolvedShare) {
      setUserReaction(getUserReaction(resolvedShare))
      setReactionCount(resolvedShare._count?.reactions || 0)
      setCommentCount(resolvedShare._count?.comments || 0)
      setShareCount(resolvedShare.post?._count?.shares || 0)
    }
  }, [resolvedShare])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isOpen, onClose])

  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useShareComments(isOpen && shareId ? shareId : undefined)

  const comments = useMemo(() => {
    if (!commentsData?.pages) return []
    return commentsData.pages.flatMap((page) => page.comments || [])
  }, [commentsData])
  const totalComments = comments.length

  useEffect(() => {
    setCommentCount(totalComments)
  }, [totalComments])

  const handleReaction = async (reactionType) => {
    if (!shareId) return

    if (userReaction === reactionType) {
      const previousReaction = userReaction
      const previousCount = reactionCount

      setUserReaction(null)
      setReactionCount(Math.max(reactionCount - 1, 0))

      try {
        await removeShareReactionMutation.mutateAsync(shareId)
        refetchShare()
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
        refetchShare()
      } catch (error) {
        setUserReaction(previousReaction)
        setReactionCount(previousCount)
      }
    }
  }

  const handleDelete = async () => {
    if (!resolvedShare?.post?.id) return

    try {
      await deleteShareMutation.mutateAsync(resolvedShare.post.id)
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      // Toast handled in hook
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const isOwnShare = resolvedShare?.user?.id === share?.user?.id

  if (!isOpen || !shareId) {
    return null
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
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[95vh] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col z-[10000]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getImageUrl(resolvedShare?.user?.avatar)} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {getInitials(resolvedShare?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {resolvedShare?.user?.name || 'Unknown user'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{resolvedShare?.user?.username}</span>
                    <span>•</span>
                    <span>
                      {resolvedShare?.createdAt
                        ? formatDistanceToNow(new Date(resolvedShare.createdAt), {
                            addSuffix: true,
                          })
                        : 'just now'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[190px] z-[10001]">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation()
                        onClose()
                        navigate(`/post/${resolvedShare.post?.id}`)
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all hover:rotate-90 duration-300"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
              {shareLoading && !resolvedShare ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading share...
                </div>
              ) : resolvedShare ? (
                <>
                  <div className="py-4 space-y-6">
                    {resolvedShare.shareCaption && (
                      <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                        {resolvedShare.shareCaption}
                      </p>
                    )}

                    {resolvedShare.post && (
                      <div
                        className="border border-border rounded-lg overflow-hidden bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => {
                          onClose()
                          navigate(`/post/${resolvedShare.post.id}`)
                        }}
                      >
                        <Post post={resolvedShare.post} isEmbedded />
                      </div>
                    )}
                  </div>

                  {(reactionCount > 0 || commentCount > 0 || shareCount > 0) && (
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex-1">
                          {reactionCount > 0 && (
                            <LikesList
                              shareId={shareId}
                              likeCount={reactionCount}
                              userReaction={userReaction}
                              onViewAll={() => setShowReactionsModal(true)}
                              isShare={true}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4">{commentCount > 0 && (
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

                  <div className="flex items-center justify-around p-2">
                    <ReactionPicker
                      postId={shareId}
                      currentReaction={userReaction}
                      onReactionChange={handleReaction}
                      disabled={addShareReactionMutation.isPending || removeShareReactionMutation.isPending}
                      isShare
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

                    <ShareButton post={resolvedShare.post} className="flex-1" />
                  </div>

                  <Separator />

                  <div ref={commentSectionRef} className="p-4 space-y-4">
                    {commentsLoading ? (
                      <div className="flex justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : comments.length > 0 ? (
                      <CommentList
                        comments={comments}
                        onEdit={handleEditComment}
                        shareId={shareId}
                        shareOwnerId={resolvedShare.user?.id}
                      />
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-6">
                        <p>No comments yet</p>
                        <p className="text-xs mt-1">Be the first to comment!</p>
                      </div>
                    )}

                    <CommentInput
                      shareId={shareId}
                      editingComment={editingComment}
                      onCancelEdit={handleCancelEdit}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Share could not be loaded.</p>
                </div>
              )}
            </div>
          </motion.div>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete share?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove this shared post from your timeline. The original content will stay up.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deleteShareMutation.isPending}
                >
                  {deleteShareMutation.isPending ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <EditShareModal
            share={resolvedShare}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
          />

          <ShareListModal
            postId={resolvedShare?.post?.id}
            isOpen={isShareListOpen}
            onClose={() => setIsShareListOpen(false)}
          />

          <ReactionsModal
            shareId={shareId}
            isOpen={showReactionsModal}
            onClose={() => setShowReactionsModal(false)}
            isShare={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
