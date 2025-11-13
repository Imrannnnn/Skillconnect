import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  description: { type: String, required: true },
  address: String,
  details: String,
  status: { type: String, enum: ["pending", "declined", "successful"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
