import express from "express";
import { protect, maybeAuth } from "../middleware/authMiddleware.js";
import {
    purchaseTickets,
    getTicket,
    checkInTicket,
    getEventAnalytics,
    downloadTicketPDF,
    getMyTickets,
    generateGuestTicket,
} from "../controllers/ticketController.js";

const router = express.Router();

router.post("/purchase", maybeAuth, purchaseTickets);
router.post("/generate-guest", protect, generateGuestTicket);
router.get("/mine", protect, getMyTickets);
router.get("/:id", getTicket);
router.get("/:id/download", downloadTicketPDF);
router.post("/check-in", protect, checkInTicket);
router.get("/analytics/:eventId", protect, getEventAnalytics);

export default router;
