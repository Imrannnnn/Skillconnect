import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  // Primary role kept for backwards compatibility with existing code
  role: { type: String, enum: ["client", "provider", "admin"], default: "client" },
  // Multi-role support so a single account can act as client, provider, and/or admin
  roles: {
    type: [String],
    enum: ["client", "provider", "admin"],
    default: ["client"],
  },
  // Public handle for providers (used in branded URLs like /@handle)
  handle: { type: String, unique: true, sparse: true },
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
  // Simple profile view counter for analytics
  profileViews: { type: Number, default: 0 },
  // Password reset support
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Email verification
  verified: { type: Boolean, default: false },
  verificationToken: String,
  // Rich verification flags for badges and trust levels
  verification: {
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    idVerified: { type: Boolean, default: false },
    trustedProvider: { type: Boolean, default: false },
    topPerformerMonths: [String], // e.g. ["2025-11"]
  },
}, { timestamps: true });

// Ensure we always store emails in lowercase for case-insensitive login and uniqueness
userSchema.pre("save", function normalizeEmail(next) {
  if (this.email && typeof this.email === "string") {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

export default mongoose.model("User", userSchema);
