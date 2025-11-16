import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  role: { type: String, enum: ["client", "provider", "admin"], default: "client" },
  categories: [String],
  // Existing provider classification (individual vs company)
  providerType: { type: String, enum: ["individual", "company"], default: "individual" },
  // New: what the provider offers
  providerMode: { type: String, enum: ["service", "product", "both"], default: "service" },
  avatarUrl: String,
  latitude: Number,
  longitude: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  // Public profile / trust signals
  social: {
    instagram: String,
    facebook: String,
    tiktok: String,
    whatsapp: String,
    website: String,
  },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  // Password reset support
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Email verification
  verified: { type: Boolean, default: false },
  verificationToken: String,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
