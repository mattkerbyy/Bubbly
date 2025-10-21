import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { useConversations } from '../hooks/useMessages'
import { MessageCircle, Trash2, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { useDeleteConversation } from '../hooks/useMessages'
import { onNewMessage, offNewMessage, onMessagesRead, offMessagesRead, onUserStatus, offUserStatus } from '../lib/socket'

// Normalize backend origin
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function ChatList({ activeConversationId, onSelectConversation }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, refetch } = useConversations()
  const deleteConversation = useDeleteConversation()
  const [deletingId, setDeletingId] = useState(null)

  const conversations = data?.data || []

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const handleAvatarClick = (e, username) => {
    e.stopPropagation()
    navigate(`/profile/${username}`)
  }

  // Listen for real-time updates
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      // Immediately update conversations cache with the new message
      queryClient.setQueryData(['conversations'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map((conversation) => {
            if (conversation.id === newMessage.conversationId) {
              return {
                ...conversation,
                lastMessage: newMessage,
                unreadCount: conversation.id === activeConversationId 
                  ? conversation.unreadCount // Don't increment if chat is open
                  : (conversation.unreadCount || 0) + 1
              }
            }
            return conversation
          }).sort((a, b) => {
            // Sort by last message timestamp to move updated conversation to top
            const aTime = a.lastMessage?.createdAt || a.createdAt
            const bTime = b.lastMessage?.createdAt || b.createdAt
            return new Date(bTime) - new Date(aTime)
          })
        }
      })
    }

    const handleMessagesRead = ({ conversationId: readConvId }) => {
      // Immediately update conversations cache to reset unread count
      queryClient.setQueryData(['conversations'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map((conversation) => {
            if (conversation.id === readConvId) {
              return {
                ...conversation,
                unreadCount: 0
              }
            }
            return conversation
          })
        }
      })
    }

    const handleUserStatus = ({ userId, isOnline }) => {
      // Update the query cache directly to reflect online status changes
      queryClient.setQueryData(['conversations'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map((conversation) => {
              if (conversation.otherUser.id === userId) {
              return {
                ...conversation,
                otherUser: {
                  ...conversation.otherUser,
                    isOnline,
                    isActive: conversation.otherUser.isActive
                }
              }
            }
            return conversation
          })
        }
      })
    }

    onNewMessage(handleNewMessage)
    onMessagesRead(handleMessagesRead)
    onUserStatus(handleUserStatus)

    return () => {
      offNewMessage(handleNewMessage)
      offMessagesRead(handleMessagesRead)
      offUserStatus(handleUserStatus)
    }
  }, [queryClient, refetch])

  const handleDelete = async () => {
    if (deletingId) {
      await deleteConversation.mutateAsync(deletingId)
      setDeletingId(null)
      if (activeConversationId === deletingId) {
        onSelectConversation(null)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-full bg-card border-r">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-1 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Start chatting with your friends!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full bg-card border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId
              const otherUser = conversation.otherUser
              const isOnline = otherUser.isOnline ?? otherUser.isActive
              const lastMessage = conversation.lastMessage

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    relative flex items-center gap-3 p-3 cursor-pointer
                    transition-all duration-200 group
                    hover:bg-accent
                    ${isActive ? 'bg-accent' : ''}
                  `}
                  onClick={() => onSelectConversation(conversation.id, otherUser)}
                >
                  {/* Avatar with online indicator */}
                  <div 
                    className="relative flex-shrink-0 cursor-pointer" 
                    onClick={(e) => handleAvatarClick(e, otherUser.username)}
                  >
                    <Avatar className="h-12 w-12 border-2 border-background hover:border-primary transition-colors">
                      <AvatarImage src={getImageUrl(otherUser.avatar)} alt={otherUser.name} />
                      <AvatarFallback>
                        {otherUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {otherUser.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                        {conversation.unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center justify-center"
                          >
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-8">
                      <p className={`
                        text-sm truncate flex-1
                        ${conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}
                      `}>
                        {lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>

                  {/* Three-dot menu button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="
                          opacity-0 group-hover:opacity-100
                          absolute right-3 top-1/2 -translate-y-1/2
                          h-8 w-8 flex items-center justify-center
                          bg-background/95 backdrop-blur-sm rounded-full
                          hover:bg-accent
                          transition-all duration-200
                          shadow-sm
                        "
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingId(conversation.id)
                        }}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
