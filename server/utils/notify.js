import Notification from "../models/notification.model.js";
import { emitNotificationToUser } from "./notificationsHub.js";

export const createNotification = async ({
  userId,
  type,
  title,
  body = "",
  link = "",
  meta = {},
}) => {
  if (!userId || !type || !title) return null;

  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    link,
    meta,
  });

  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  emitNotificationToUser(userId, {
    notification,
    unreadCount,
  });

  return notification;
};
