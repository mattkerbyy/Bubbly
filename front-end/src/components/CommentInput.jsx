import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreateComment, useUpdateComment } from '@/hooks/useComments'
import { useUpdateShareComment } from '@/hooks/useShareComments'
import { motion } from 'framer-motion'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')
const MAX_LENGTH = 500

const CommentInput = forwardRef(({ postId, shareId, editingComment, onCancelEdit }, ref) => {
  const { user } = useAuthStore()
  const createCommentMutation = useCreateComment()
  const updateCommentMutation = useUpdateComment()
  const updateShareCommentMutation = useUpdateShareComment()
  const [content, setContent] = useState('')
  const textareaRef = useRef(null)

  const isEditing = !!editingComment

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
    },
    scrollIntoView: (options) => {
      textareaRef.current?.scrollIntoView(options)
    }
  }))

  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content)
      textareaRef.current?.focus()
    }
  }, [editingComment])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent) return

    if (trimmedContent.length > MAX_LENGTH) return

    // Store content before mutation
    const contentToSubmit = trimmedContent

    // Clear input immediately for better UX
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      if (isEditing) {
        const targetShareId = shareId || editingComment?.shareId
        if (targetShareId) {
          await updateShareCommentMutation.mutateAsync({
            commentId: editingComment.id,
            content: contentToSubmit,
            shareId: targetShareId,
          })
        } else {
          await updateCommentMutation.mutateAsync({
            commentId: editingComment.id,
            content: contentToSubmit,
          })
        }
        onCancelEdit?.()
      } else {
        await createCommentMutation.mutateAsync({
          postId,
          shareId,
          content: contentToSubmit,
        })
      }
    } catch (error) {
      // Restore content if mutation failed
      setContent(contentToSubmit)
  // Failed to submit comment handled by UI
    }
  }

  const handleCancel = () => {
    setContent('')
    onCancelEdit?.()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === 'Escape' && isEditing) {
      handleCancel()
    }
  }

  const handleInput = (e) => {
    setContent(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const isSubmitting =
    createCommentMutation.isPending ||
    updateCommentMutation.isPending ||
    updateShareCommentMutation.isPending
  const canSubmit = content.trim().length > 0 && content.length <= MAX_LENGTH && !isSubmitting

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
      onSubmit={handleSubmit}
    >
      {!isEditing && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getImageUrl(user?.avatar)} />
          <AvatarFallback className="bg-primary text-white text-xs">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isEditing ? "Edit your comment..." : "Write a comment..."}
          className="w-full bg-muted rounded-2xl px-4 py-2 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          rows={1}
          maxLength={MAX_LENGTH}
          disabled={isSubmitting}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={!canSubmit}
            className={`h-8 w-8 transition-colors ${
              canSubmit
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground opacity-50'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {content.length > MAX_LENGTH - 50 && (
          <div className={`text-xs mt-1 px-2 ${content.length > MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
            {content.length}/{MAX_LENGTH}
          </div>
        )}
      </div>
    </motion.form>
  )
})

CommentInput.displayName = 'CommentInput'

export default CommentInput
