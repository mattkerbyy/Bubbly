import express from "express";
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../controllers/NotifFeature/notificationController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAllNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/", deleteAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
