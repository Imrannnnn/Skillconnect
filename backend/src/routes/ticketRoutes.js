import express from "express";
import { protect, maybeAuth } from "../middleware/authMiddleware.js";
import {
    purchaseTickets,
    getTicket,
    checkInTicket,
    getEventAnalytics,
} from "../controllers/ticketController.js";

const router = express.Router();

router.post("/purchase", maybeAuth, purchaseTickets);
router.get("/:id", getTicket);
router.post("/check-in", protect, checkInTicket);
router.get("/analytics/:eventId", protect, getEventAnalytics);

export default router;
