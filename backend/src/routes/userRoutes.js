import express from "express";
import {
    getUser,
    listUsers,
    smartSearchProviders,
    aiChatAssistant,
    deleteMe,
    becomeProvider,
    updateSubscribedCategories
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listUsers);
router.post("/smart-search", smartSearchProviders);
router.post("/ai/chat", aiChatAssistant);
router.post("/me/become-provider", protect, becomeProvider);
router.put("/me/subscriptions", protect, updateSubscribedCategories);
router.delete("/me", protect, deleteMe);
router.get("/:id", getUser);

export default router;
