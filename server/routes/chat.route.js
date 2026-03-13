import express from "express";
import { verifyToken } from "../middelware/jwt.js";
import {
  upsertConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
} from "../controller/chat.controller.js";

const router = express.Router();

router.post("/conversations", verifyToken, upsertConversation);
router.get("/conversations", verifyToken, getMyConversations);
router.get("/conversations/:id/messages", verifyToken, getConversationMessages);
router.post("/conversations/:id/messages", verifyToken, sendMessage);

export default router;
