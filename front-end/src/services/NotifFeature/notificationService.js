import api from "../../lib/api";

/**
 * Get all notifications for current user
 * @param {number} page - Page number
 * @param {number} limit - Number of notifications per page
 */
export const getAllNotifications = async (page = 1, limit = 20) => {
  const response = await api.get("/notifications", {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async () => {
  const response = await api.delete("/notifications");
  return response.data;
};
