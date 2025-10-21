import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Minimize2, Maximize2, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useMessages, useSendMessage, useMarkMessagesAsRead, useConversations } from '../hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '../stores/useAuthStore'
import { onNewMessage, offNewMessage, emitTypingStart, emitTypingStop } from '../lib/socket'
import { useQueryClient } from '@tanstack/react-query'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function GlobalChatPopup() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  
  const [openChats, setOpenChats] = useState([])
  const [minimizedChats, setMinimizedChats] = useState(new Set())
  const { data: conversationsData } = useConversations()
  
  const conversations = conversationsData?.data || []
  
  // Don't show on messages page
  const isMessagesPage = location.pathname === '/messages'
  
  useEffect(() => {
    if (!currentUser) return
    
    const handleNewMessage = (newMessage) => {
      // Only show popup if not on messages page and not from current user
      if (isMessagesPage || newMessage.senderId === currentUser.id) return
      
      // Find the conversation
      const conversation = conversations.find(c => c.id === newMessage.conversationId)
      if (!conversation) return
      
      // Check if chat is already open
      const existingChat = openChats.find(c => c.conversationId === newMessage.conversationId)
      
      if (!existingChat) {
        // Open new chat popup
        setOpenChats(prev => {
          // Limit to 3 open chats
          const newChats = [...prev]
          if (newChats.length >= 3) {
            newChats.shift() // Remove oldest
          }
          return [...newChats, {
            conversationId: conversation.id,
            otherUser: conversation.otherUser
          }]
        })
      }
    }
    
    onNewMessage(handleNewMessage)
    
    return () => {
      offNewMessage(handleNewMessage)
    }
  }, [currentUser, isMessagesPage, conversations, openChats])
  
  const handleCloseChat = (conversationId) => {
    setOpenChats(prev => prev.filter(c => c.conversationId !== conversationId))
    setMinimizedChats(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })
  }
  
  const handleToggleMinimize = (conversationId) => {
    setMinimizedChats(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId)
      } else {
        newSet.add(conversationId)
      }
      return newSet
    })
  }
  
  const handleOpenInMessagesPage = (conversationId) => {
    navigate('/messages', { 
      state: { conversationId } 
    })
    handleCloseChat(conversationId)
  }
  
  if (isMessagesPage || openChats.length === 0) return null
  
  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end gap-3 pointer-events-none">
      {openChats.map((chat, index) => (
        <ChatPopupWindow
          key={chat.conversationId}
          conversationId={chat.conversationId}
          otherUser={chat.otherUser}
          isMinimized={minimizedChats.has(chat.conversationId)}
          onClose={() => handleCloseChat(chat.conversationId)}
          onToggleMinimize={() => handleToggleMinimize(chat.conversationId)}
          onOpenFull={() => handleOpenInMessagesPage(chat.conversationId)}
          style={{ marginRight: `${index * 10}px` }}
        />
      ))}
    </div>
  )
}

function ChatPopupWindow({ conversationId, otherUser, isMinimized, onClose, onToggleMinimize, onOpenFull }) {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const { data, refetch } = useMessages(conversationId)
  const sendMessageMutation = useSendMessage()
  const { mutate: markAsRead } = useMarkMessagesAsRead()
  
  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState(null)
  
  const messages = data?.data || []
  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }
  
  // Mark as read when opened
  useEffect(() => {
    if (!isMinimized && conversationId) {
      markAsRead({ conversationId, otherUserId: otherUser.id })
    }
  }, [isMinimized, conversationId, otherUser])
  
  // Listen for new messages
  useEffect(() => {
    if (!conversationId) return
    
    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldData) => {
          if (!oldData) return oldData
          
          const messageExists = oldData.data?.some(msg => msg.id === newMessage.id)
          if (messageExists) return oldData
          
          return {
            ...oldData,
            data: [...(oldData.data || []), newMessage]
          }
        })
        
        if (!isMinimized) {
          markAsRead({ conversationId, otherUserId: otherUser.id })
        }
      }
    }
    
    onNewMessage(handleNewMessage)
    
    return () => {
      offNewMessage(handleNewMessage)
    }
  }, [conversationId, isMinimized, otherUser, queryClient])
  
  const handleTyping = (value) => {
    setMessage(value)
    
    if (value.trim() && !typingTimeout) {
      emitTypingStart(conversationId, otherUser.id)
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    const timeout = setTimeout(() => {
      emitTypingStop(conversationId, otherUser.id)
      setTypingTimeout(null)
    }, 1000)
    
    setTypingTimeout(timeout)
  }
  
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || sendMessageMutation.isPending) return
    
    const content = message.trim()
    setMessage('')
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)
    }
    emitTypingStop(conversationId, otherUser.id)
    
    await sendMessageMutation.mutateAsync({
      conversationId,
      content
    })
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }
  
  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      className="pointer-events-auto w-[340px] bg-card border rounded-t-lg shadow-2xl flex flex-col overflow-hidden"
      style={{ height: isMinimized ? '56px' : '450px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-primary text-primary-foreground cursor-pointer"
        onClick={onToggleMinimize}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={getImageUrl(otherUser.avatar)} />
          <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{otherUser.name}</p>
          <p className="text-xs opacity-90">
            {otherUser.isOnline ? 'Active now' : 'Offline'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onToggleMinimize()
          }}
        >
          {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-accent/30">
            {messages.slice(-10).map((msg) => {
              const isSent = msg.senderId === currentUser.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      isSent
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-2">
            <Textarea
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[36px] max-h-[80px] resize-none text-sm"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="h-9 w-9 flex-shrink-0"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {/* Open in full */}
          <div className="px-3 py-2 border-t bg-muted/50">
            <button
              onClick={onOpenFull}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              Open in Messages
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
