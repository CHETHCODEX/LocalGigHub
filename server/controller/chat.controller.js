import Application from "../models/application.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import createError from "../utils/createError.js";
import { createNotification } from "../utils/notify.js";

const getParticipantsByRole = (role, requesterId, participantId) => {
  if (role === "shop") {
    return { shopId: requesterId, studentId: participantId };
  }
  if (role === "student") {
    return { shopId: participantId, studentId: requesterId };
  }
  return null;
};

const ensureConversationParticipant = (conversation, userId) =>
  conversation.shopId === userId || conversation.studentId === userId;

export const upsertConversation = async (req, res, next) => {
  try {
    const { gigId, participantId } = req.body;

    if (!gigId || !participantId) {
      return next(createError(400, "gigId and participantId are required"));
    }

    const participants = getParticipantsByRole(
      req.role,
      req.userId,
      participantId,
    );
    if (!participants) {
      return next(createError(403, "Only students and shops can start chats"));
    }

    const hasApplication = await Application.findOne({
      gigId,
      shopId: participants.shopId,
      studentId: participants.studentId,
    });

    if (!hasApplication) {
      return next(
        createError(
          403,
          "Chat is allowed only between related applicant and shop",
        ),
      );
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        gigId,
        shopId: participants.shopId,
        studentId: participants.studentId,
      },
      {
        $setOnInsert: {
          gigId,
          shopId: participants.shopId,
          studentId: participants.studentId,
          lastMessage: "",
          lastMessageAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    res.status(200).json(conversation);
  } catch (error) {
    if (error?.code === 11000) {
      try {
        const existing = await Conversation.findOne({
          gigId: req.body.gigId,
          shopId: req.role === "shop" ? req.userId : req.body.participantId,
          studentId:
            req.role === "student" ? req.userId : req.body.participantId,
        });
        return res.status(200).json(existing);
      } catch (innerError) {
        return next(innerError);
      }
    }
    next(error);
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    if (!["shop", "student"].includes(req.role)) {
      return next(createError(403, "Only students and shops can access chats"));
    }

    const conversations = await Conversation.find({
      $or: [{ shopId: req.userId }, { studentId: req.userId }],
    }).sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    if (!ensureConversationParticipant(conversation, req.userId)) {
      return next(createError(403, "Not authorized to view these messages"));
    }

    const messages = await Message.find({
      conversationId: conversation._id.toString(),
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    if (!ensureConversationParticipant(conversation, req.userId)) {
      return next(createError(403, "Not authorized to send message"));
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return next(createError(400, "Message text is required"));
    }

    const message = await Message.create({
      conversationId: conversation._id.toString(),
      senderId: req.userId,
      text,
      readBy: [req.userId],
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientId =
      conversation.shopId === req.userId
        ? conversation.studentId
        : conversation.shopId;

    await createNotification({
      userId: recipientId,
      type: "chat:new_message",
      title: "New chat message",
      body: text.length > 90 ? `${text.slice(0, 90)}...` : text,
      link: `/chat?gigId=${conversation.gigId}&userId=${req.userId}`,
      meta: {
        conversationId: conversation._id,
        gigId: conversation.gigId,
        senderId: req.userId,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};
