import Notification from "../models/notification.model.js";
import createError from "../utils/createError.js";
import { registerNotificationClient } from "../utils/notificationsHub.js";

export const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === "true";

    const filters = {
      userId: req.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filters),
      Notification.countDocuments({ userId: req.userId, isRead: false }),
    ]);

    res.status(200).json({
      items,
      total,
      page,
      limit,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return next(createError(404, "Notification not found"));
    }

    if (notification.userId !== req.userId) {
      return next(createError(403, "Not authorized"));
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.status(200).json({ notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

export const streamNotifications = async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.write(
      `event: snapshot\\ndata: ${JSON.stringify({ unreadCount })}\\n\\n`,
    );

    const unregister = registerNotificationClient(req.userId, res);

    req.on("close", () => {
      unregister();
      res.end();
    });
  } catch (error) {
    next(error);
  }
};
