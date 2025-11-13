import express from "express";
import { listChats, createOrGetChat, getChatById, sendMessageToChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/", protect, listChats);
router.post("/", protect, createOrGetChat);
router.get("/:chatId", protect, getChatById);
router.post("/:chatId/messages", protect, sendMessageToChat);
export default router;
