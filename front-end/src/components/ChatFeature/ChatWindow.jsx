import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Send, Loader2, MessageCircle, Menu } from "lucide-react";
import { useMessages, useSendMessage, useMarkMessagesAsRead } from "../../hooks/MessageFeature/useMessages";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  onNewMessage,
  offNewMessage,
  onUserTyping,
  offUserTyping,
  onUserStoppedTyping,
  offUserStoppedTyping,
  onMessagesRead,
  offMessagesRead,
  emitTypingStart,
  emitTypingStop,
} from "../../lib/socket";
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function ChatWindow({
  conversationId,
  otherUser,
  onShowChatList,
}) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const { mutate: markAsRead, isPending: isMarkingRead } =
    useMarkMessagesAsRead();

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = data?.data || [];

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const handleAvatarClick = (username) => {
    navigate(`/profile/${username}`);
  };
  const groupMessagesByTime = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const msgTime = new Date(msg.createdAt);
      const shouldShowTime =
        index === 0 ||
        differenceInMinutes(msgTime, new Date(messages[index - 1].createdAt)) >=
          5;

      if (shouldShowTime) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          timestamp: msgTime,
          messages: [msg],
        };
      } else {
        currentGroup.messages.push(msg);
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const messageGroups = groupMessagesByTime(messages);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const triggerMarkAsRead = useCallback(() => {
    if (!conversationId || !otherUser || isMarkingRead) {
      return;
    }

    markAsRead({
      conversationId,
      otherUserId: otherUser.id,
    });
  }, [conversationId, otherUser, isMarkingRead, markAsRead]);
  useEffect(() => {
    triggerMarkAsRead();
  }, [triggerMarkAsRead]);
  useEffect(() => {
    if (!conversationId || !otherUser) {
      return;
    }

    const hasUnreadFromOtherUser = messages.some(
      (msg) => msg.senderId === otherUser.id && !msg.isRead
    );

    if (hasUnreadFromOtherUser) {
      triggerMarkAsRead();
    }
  }, [messages, conversationId, otherUser, triggerMarkAsRead]);
  useEffect(() => {
    if (!conversationId) return;
    const handleNewMessage = (newMessage) => {

      if (newMessage.conversationId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (oldData) => {
          if (!oldData) return oldData;
          const messageExists = oldData.data?.some(
            (msg) => msg.id === newMessage.id
          );
          if (messageExists) return oldData;

          return {
            ...oldData,
            data: [...(oldData.data || []), newMessage],
          };
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        triggerMarkAsRead();
      }
    };
    const handleUserTyping = ({ conversationId: typingConvId, userId }) => {
      if (typingConvId === conversationId && userId === otherUser.id) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = ({
      conversationId: typingConvId,
      userId,
    }) => {
      if (typingConvId === conversationId && userId === otherUser.id) {
        setIsTyping(false);
      }
    };

    const handleMessagesRead = ({ conversationId: readConvId }) => {
      if (readConvId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((msg) => ({
              ...msg,
              isRead: true,
            })),
          };
        });
      }
    };
    onNewMessage(handleNewMessage);
    onUserTyping(handleUserTyping);
    onUserStoppedTyping(handleUserStoppedTyping);
    onMessagesRead(handleMessagesRead);
    return () => {
      offNewMessage(handleNewMessage);
      offUserTyping(handleUserTyping);
      offUserStoppedTyping(handleUserStoppedTyping);
      offMessagesRead(handleMessagesRead);
    };
  }, [conversationId, otherUser, queryClient, refetch, triggerMarkAsRead]);

  const handleTyping = (value) => {
    setMessage(value);
    if (value.trim() && !typingTimeout) {
      emitTypingStart(conversationId, otherUser.id);
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const timeout = setTimeout(() => {
      emitTypingStop(conversationId, otherUser.id);
      setTypingTimeout(null);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || sendMessageMutation.isPending) return;

    const content = message.trim();
    setMessage("");
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    emitTypingStop(conversationId, otherUser.id);
    await sendMessageMutation.mutateAsync({
      conversationId,
      content,
    });
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!conversationId || !otherUser) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50 overflow-hidden">
        <div className="text-center space-y-3">
          <MessageCircle className="h-20 w-20 text-muted-foreground mx-auto" />
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="text-sm text-muted-foreground">
            Choose a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Messages Skeleton */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? "justify-start" : "justify-end"
              }`}
            >
              <Skeleton
                className={`h-12 ${i % 2 === 0 ? "w-64" : "w-48"} rounded-2xl`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chat Header - Fixed */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3"
      >
        {/* Mobile Menu Button */}
        {onShowChatList && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowChatList}
            className="md:hidden flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div
          className="relative cursor-pointer"
          onClick={() => handleAvatarClick(otherUser.username)}
        >
          <Avatar className="h-10 w-10 border-2 border-background hover:border-primary transition-colors">
            <AvatarImage
              src={getImageUrl(otherUser.avatar)}
              alt={otherUser.name}
            />
            <AvatarFallback>
              {otherUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {(otherUser.isOnline ?? otherUser.isActive) && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => handleAvatarClick(otherUser.username)}
        >
          <h3 className="font-semibold">{otherUser.name}</h3>
          <p className="text-xs text-muted-foreground">
            {otherUser.isOnline ?? otherUser.isActive
              ? "Active now"
              : "Offline"}
          </p>
        </div>
      </motion.div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-accent/30">
        <AnimatePresence mode="popLayout">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {/* Time Separator */}
              <div className="flex justify-center my-4">
                <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  {format(group.timestamp, "MMMM d, yyyy • h:mm a")}
                </span>
              </div>

              {/* Messages in this time group */}
              {group.messages.map((msg, msgIndex) => {
                const isSent = msg.senderId === currentUser.id;
                const isLastInGroup = msgIndex === group.messages.length - 1;
                const isLastMessage =
                  groupIndex === messageGroups.length - 1 && isLastInGroup;
                const showAvatar =
                  msgIndex === 0 ||
                  group.messages[msgIndex - 1].senderId !== msg.senderId;
                const nextMessage = group.messages[msgIndex + 1];
                const showTimestamp =
                  !nextMessage || nextMessage.senderId !== msg.senderId;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${
                      isSent ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <Avatar
                        className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          handleAvatarClick(
                            isSent ? currentUser.username : otherUser.username
                          )
                        }
                      >
                        <AvatarImage
                          src={getImageUrl(
                            isSent ? currentUser.avatar : otherUser.avatar
                          )}
                          alt={isSent ? currentUser.name : otherUser.name}
                        />
                        <AvatarFallback>
                          {(isSent ? currentUser.name : otherUser.name)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8" />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`flex flex-col ${
                        isSent ? "items-end" : "items-start"
                      } max-w-[70%]`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`
                          px-4 py-2 rounded-2xl
                          ${
                            isSent
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border rounded-bl-sm"
                          }
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </motion.div>

                      {/* Show status only on last message in conversation */}
                      {isLastMessage && isSent && (
                        <span className="text-xs text-muted-foreground mt-1 px-2">
                          {msg.isRead
                            ? `Seen ${formatDistanceToNow(
                                new Date(msg.createdAt),
                                { addSuffix: true }
                              )}`
                            : `Sent ${formatDistanceToNow(
                                new Date(msg.createdAt),
                                { addSuffix: true }
                              )}`}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
            >
              <Avatar
                className="h-8 w-8 cursor-pointer"
                onClick={() => handleAvatarClick(otherUser.username)}
              >
                <AvatarImage
                  src={getImageUrl(otherUser.avatar)}
                  alt={otherUser.name}
                />
                <AvatarFallback>
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span
                  className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSendMessage}
        className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="h-11 w-11 flex-shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
