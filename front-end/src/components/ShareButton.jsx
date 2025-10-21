import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useSharePost } from '@/hooks/useShares'
import AudienceSelector from '@/components/AudienceSelector'
import { cn } from '@/lib/utils'

// Ensure we have the backend origin
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

const ShareButton = ({ post, className, showCount = true }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [shareCaption, setShareCaption] = useState('')
  const [audience, setAudience] = useState('Public')
  const { mutate: sharePostMutation, isPending } = useSharePost()

  const handleShare = () => {
    sharePostMutation(
      { postId: post.id, shareCaption: shareCaption.trim() || null, audience },
      {
        onSuccess: () => {
          setIsOpen(false)
          setShareCaption('')
          setAudience('Public')
        },
      }
    )
  }

  const shareCount = post._count?.shares || 0

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
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

  const getFileType = (filename) => {
    if (!filename) return 'file'
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'image'
    } else if (['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv', 'flv'].includes(ext)) {
      return 'video'
    } else if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
      return 'audio'
    } else if (['doc', 'docx', 'pdf', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return 'document'
    }
    return 'file'
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return '📷'
      case 'video':
        return '🎥'
      case 'audio':
        return '🎵'
      case 'document':
        return '📄'
      default:
        return '📎'
    }
  }

  const getFileLabel = (type, count) => {
    const plural = count > 1 ? 's' : ''
    switch (type) {
      case 'image':
        return `image${plural}`
      case 'video':
        return `video${plural}`
      case 'audio':
        return `audio file${plural}`
      case 'document':
        return `document${plural}`
      default:
        return `file${plural}`
    }
  }

  const renderFileSummary = () => {
    if (!post.files || post.files.length === 0) return null

    // Get file types
    const fileTypes = post.files.map(file => getFileType(file))
    const uniqueTypes = [...new Set(fileTypes)]

    // If all files are the same type
    if (uniqueTypes.length === 1) {
      const type = uniqueTypes[0]
      return (
        <div className="mt-2 text-xs text-muted-foreground">
          {getFileIcon(type)} {post.files.length} {getFileLabel(type, post.files.length)}
        </div>
      )
    }

    // If mixed file types
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        📎 {post.files.length} file{post.files.length > 1 ? 's' : ''}
      </div>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn('flex-1 gap-2 text-muted-foreground hover:text-primary', className)}
        aria-label="Share post"
      >
        <Share2 className="h-5 w-5" />
        <span className="font-medium">
          Share{shareCount > 0 && ` ${shareCount}`}
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>
              Add an optional caption to your share
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Original Content Preview */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={getImageUrl(post.user?.avatar)} 
                    alt={post.user?.name} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(post.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {post.user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{post.user?.username}
                    </span>
                  </div>
                  {post.content && (
                    <p className="text-sm text-foreground mt-1 line-clamp-3">
                      {post.content}
                    </p>
                  )}
                  {renderFileSummary()}
                </div>
              </div>
            </div>

            {/* Share Caption Input */}
            <div className="space-y-2">
              <label htmlFor="shareCaption" className="text-sm font-medium">
                Your caption (optional)
              </label>
              <Textarea
                id="shareCaption"
                placeholder="Add your thoughts about this post..."
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                maxLength={280}
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {shareCaption.length}/280
              </div>
            </div>

            {/* Audience Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Who can see this share?
              </label>
              <AudienceSelector
                value={audience}
                onChange={setAudience}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={isPending}>
              {isPending ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShareButton
