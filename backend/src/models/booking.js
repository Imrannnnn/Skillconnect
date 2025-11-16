import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Client contact details for ticket-style emails
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  clientEmail: String,
  // Booking description (service description OR free-text product request)
  description: { type: String, required: true },
  address: String,
  details: String,
  // New: classify booking
  bookingType: { type: String, enum: ["service", "product"], default: "service" },
  // Optional product reference when this booking is for a specific product
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productSnapshot: {
    productCode: String,
    name: String,
    description: String,
    category: String,
    price: Number,
  },
  // Optional agreed price for this booking (service or product), stored in smallest currency unit (e.g. kobo)
  price: Number,
  currency: String,
  // Optional slot-based scheduling
  date: String,       // e.g. "2025-11-18" (YYYY-MM-DD)
  startTime: String,  // e.g. "09:00" (24h; UI can show AM/PM)
  endTime: String,    // e.g. "10:00"
  // Legacy coarse status field (kept for backwards compatibility with existing UIs)
  status: { type: String, enum: ["pending", "declined", "successful"], default: "pending" },
  // New, richer flow status for timeline view
  flowStatus: {
    type: String,
    enum: [
      "requested",
      "provider_accepted",
      "on_the_way",
      "job_started",
      "job_completed",
      "payment_released",
      "cancelled",
      "declined",
    ],
    default: "requested",
  },
  statusHistory: [{
    status: String,
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
