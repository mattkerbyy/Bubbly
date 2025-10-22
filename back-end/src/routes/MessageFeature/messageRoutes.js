import express from "express";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getUnreadCount,
} from "../../controllers/MessageFeature/messageController.js";

const router = express.Router();

router.use(authenticate);

router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/conversations/user/:otherUserId", getOrCreateConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.patch("/conversations/:conversationId/read", markMessagesAsRead);
router.delete("/conversations/:conversationId", deleteConversation);

export default router;
