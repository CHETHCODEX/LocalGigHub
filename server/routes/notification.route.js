import express from "express";
import { verifyToken } from "../middelware/jwt.js";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
} from "../controller/notification.controller.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.get("/stream", verifyToken, streamNotifications);
router.patch("/read-all", verifyToken, markAllNotificationsRead);
router.patch("/:id/read", verifyToken, markNotificationRead);

export default router;
