import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, UserPlus, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useMarkAsRead, useDeleteNotification } from '@/hooks/useNotifications'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function NotificationItem({ notification, onClose }) {
  const navigate = useNavigate()
  const markAsReadMutation = useMarkAsRead()
  const deleteNotificationMutation = useDeleteNotification()

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

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationText = () => {
    const senderName = notification.sender?.name || notification.sender?.username || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">{senderName}</span> liked your post
          </>
        )
      case 'comment':
        return (
          <>
            <span className="font-semibold">{senderName}</span> commented on your post
          </>
        )
      case 'follow':
        return (
          <>
            <span className="font-semibold">{senderName}</span> started following you
          </>
        )
      default:
        return notification.content
    }
  }

  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      // For follow notifications, go to the follower's profile
      navigate(`/profile/${notification.sender?.username}`)
    } else if (notification.postId) {
      // For likes and comments, navigate to the specific post
      navigate(`/post/${notification.postId}`)
    }

    // Close dropdown
    onClose?.()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteNotificationMutation.mutate(notification.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`group relative flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      {/* Avatar with Icon */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getImageUrl(notification.sender?.avatar)} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(notification.sender?.name)}
          </AvatarFallback>
        </Avatar>
        {/* Type Icon */}
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
          {getNotificationIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">
          {getNotificationText()}
        </p>
        
        {/* Post Preview (for likes and comments) */}
        {notification.post && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {notification.post.content}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        disabled={deleteNotificationMutation.isPending}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Post Image Preview (for likes and comments) */}
      {notification.post?.image && (
        <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden">
          <img
            src={getImageUrl(notification.post.image)}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  )
}
