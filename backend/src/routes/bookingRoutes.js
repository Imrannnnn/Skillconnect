import express from "express";
import { createBooking, updateBookingStatus, listBookings } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/", protect, createBooking);
router.put("/:id/status", protect, updateBookingStatus);
router.get("/", protect, listBookings);
export default router;
