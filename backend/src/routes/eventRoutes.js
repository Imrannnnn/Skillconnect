import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getMyEvents,
} from "../controllers/eventController.js";
import { supportEvent, getEventSupporters } from "../controllers/supportController.js";

const router = express.Router();

router.post("/", protect, createEvent);
router.get("/", getEvents);
router.get("/my-events", protect, getMyEvents);
router.get("/:id", getEventById);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Support / Donation routes
router.post("/:eventId/support", protect, supportEvent);
router.get("/:eventId/supporters", getEventSupporters);

export default router;
