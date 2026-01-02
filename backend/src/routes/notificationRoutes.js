import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Notification from "../models/notification.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (e) {
        res.status(500).json({ message: "Failed", error: e.message });
    }
});

router.put("/:id/read", protect, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Marked read" });
    } catch (e) {
        res.status(500).json({ message: "Failed" });
    }
});

export default router;
