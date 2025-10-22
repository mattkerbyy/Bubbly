import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getUnreadCount,
} from "../../services/MessageFeature/messageService";
import { emitSendMessage, emitMarkRead } from "../../lib/socket";
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 1000 * 60, // 1 minute - we rely on Socket.IO for real-time updates
    refetchInterval: false, // Disable polling - rely on Socket.IO instead
    refetchOnWindowFocus: true, // Only refetch when returning to window
  });
};
export const useGetOrCreateConversation = (otherUserId) => {
  return useQuery({
    queryKey: ["conversation", otherUserId],
    queryFn: () => getOrCreateConversation(otherUserId),
    enabled: !!otherUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
export const useMessages = (conversationId, page = 1) => {
  return useQuery({
    queryKey: ["messages", conversationId, page],
    queryFn: () => getMessages(conversationId, page),
    enabled: !!conversationId,
    staleTime: 1000 * 60, // 1 minute - we rely on Socket.IO for real-time updates
    refetchInterval: false, // Disable polling - rely on Socket.IO instead
    refetchOnWindowFocus: true, // Only refetch when returning to window
    keepPreviousData: true,
  });
};
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }) =>
      sendMessage(conversationId, content),
    onSuccess: (response, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      const message = response.data;
      const recipientId = message.recipientId;
      emitSendMessage(message, recipientId);
    },
  });
};
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, otherUserId }) =>
      markMessagesAsRead(conversationId),
    onSuccess: (_, { conversationId, otherUserId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      emitMarkRead(conversationId, otherUserId);
    },
  });
};
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId) => deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};
