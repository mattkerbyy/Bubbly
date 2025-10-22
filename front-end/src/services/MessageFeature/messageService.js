import api from "../../lib/api";
export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data;
};
export const getOrCreateConversation = async (otherUserId) => {
  const response = await api.get(`/messages/conversations/user/${otherUserId}`);
  return response.data;
};
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const response = await api.get(
    `/messages/conversations/${conversationId}/messages`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};
export const sendMessage = async (conversationId, content) => {
  const response = await api.post(
    `/messages/conversations/${conversationId}/messages`,
    {
      content,
    }
  );
  return response.data;
};
export const markMessagesAsRead = async (conversationId) => {
  const response = await api.patch(
    `/messages/conversations/${conversationId}/read`
  );
  return response.data;
};
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(
    `/messages/conversations/${conversationId}`
  );
  return response.data;
};
export const getUnreadCount = async () => {
  const response = await api.get("/messages/unread-count");
  return response.data;
};
