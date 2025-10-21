import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getUnreadCount
} from '../services/messageService'
import { emitSendMessage, emitMarkRead } from '../lib/socket'

// Get all conversations
export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 1000 * 60, // 1 minute - we rely on Socket.IO for real-time updates
    refetchInterval: false, // Disable polling - rely on Socket.IO instead
    refetchOnWindowFocus: true // Only refetch when returning to window
  })
}

// Get or create conversation
export const useGetOrCreateConversation = (otherUserId) => {
  return useQuery({
    queryKey: ['conversation', otherUserId],
    queryFn: () => getOrCreateConversation(otherUserId),
    enabled: !!otherUserId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Get messages for a conversation
export const useMessages = (conversationId, page = 1) => {
  return useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: () => getMessages(conversationId, page),
    enabled: !!conversationId,
    staleTime: 1000 * 60, // 1 minute - we rely on Socket.IO for real-time updates
    refetchInterval: false, // Disable polling - rely on Socket.IO instead
    refetchOnWindowFocus: true, // Only refetch when returning to window
    keepPreviousData: true
  })
}

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, content }) => 
      sendMessage(conversationId, content),
    onSuccess: (response, { conversationId }) => {
      // Invalidate messages for this conversation
  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      
  // Invalidate conversations list
  queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Emit socket event for real-time delivery
      const message = response.data
      const recipientId = message.recipientId
      emitSendMessage(message, recipientId)
    }
  })
}

// Mark messages as read mutation
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, otherUserId }) => 
      markMessagesAsRead(conversationId),
    onSuccess: (_, { conversationId, otherUserId }) => {
      // Invalidate messages for this conversation
  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      
  // Invalidate conversations list
  queryClient.invalidateQueries({ queryKey: ['conversations'] })
      
  // Invalidate unread count
  queryClient.invalidateQueries({ queryKey: ['unread-count'] })

      // Emit socket event for read receipt
      emitMarkRead(conversationId, otherUserId)
    }
  })
}

// Delete conversation mutation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId) => deleteConversation(conversationId),
    onSuccess: () => {
      // Invalidate conversations list
  queryClient.invalidateQueries({ queryKey: ['conversations'] })
      
  // Invalidate unread count
  queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    }
  })
}

// Get unread message count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60 // Refetch every minute
  })
}
