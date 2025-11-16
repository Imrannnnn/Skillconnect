import express from "express";
import { createBooking, updateBookingStatus, listBookings, updateBookingFlow } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/", protect, createBooking);
router.put("/:id/status", protect, updateBookingStatus);
router.put("/:id/timeline", protect, updateBookingFlow);
router.get("/", protect, listBookings);
export default router;
