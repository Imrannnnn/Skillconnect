import express from "express";
import { getUser, listUsers, smartSearchProviders, aiChatAssistant, deleteMe } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listUsers);
router.post("/smart-search", smartSearchProviders);
router.post("/ai/chat", aiChatAssistant);
router.delete("/me", protect, deleteMe);
router.get("/:id", getUser);

export default router;
