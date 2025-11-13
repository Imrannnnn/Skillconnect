import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  role: { type: String, enum: ["client", "provider", "admin"], default: "client" },
  categories: [String],
  providerType: { type: String, enum: ["individual", "company"], default: "individual" },
  avatarUrl: String,
  latitude: Number,
  longitude: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
