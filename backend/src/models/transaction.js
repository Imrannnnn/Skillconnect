import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["fund", "escrow", "release", "refund", "withdraw", "event_support", "ticket_purchase", "digital_purchase"],
    required: true,
  },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  amount: { type: Number, required: true }, // in smallest currency unit (e.g. kobo)
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  providerReference: String, // e.g. Paystack reference
  metadata: {},
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
