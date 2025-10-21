import api from '../lib/api'

// Get all conversations
export const getConversations = async () => {
  const response = await api.get('/messages/conversations')
  return response.data
}

// Get or create conversation with another user
export const getOrCreateConversation = async (otherUserId) => {
  const response = await api.get(`/messages/conversations/user/${otherUserId}`)
  return response.data
}

// Get messages for a conversation
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
    params: { page, limit }
  })
  return response.data
}

// Send a message
export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
    content
  })
  return response.data
}

// Mark messages as read
export const markMessagesAsRead = async (conversationId) => {
  const response = await api.patch(`/messages/conversations/${conversationId}/read`)
  return response.data
}

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/messages/conversations/${conversationId}`)
  return response.data
}

// Get unread message count
export const getUnreadCount = async () => {
  const response = await api.get('/messages/unread-count')
  return response.data
}
