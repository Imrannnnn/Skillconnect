import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  // Stored in the smallest currency unit (e.g. kobo)
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "NGN" },
}, { timestamps: true });

export default mongoose.model("Wallet", walletSchema);
