import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["admin", "staff"],
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  acceptedAt: { type: Date },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: true,
  },
}, { timestamps: true });

invitationSchema.virtual("isExpired").get(function () {
  return Date.now() > this.expiresAt;
});

invitationSchema.virtual("isAccepted").get(function () {
  return !!this.acceptedAt;
});

invitationSchema.set("toJSON", { virtuals: true });
invitationSchema.set("toObject", { virtuals: true });

export default mongoose.model("Invitation", invitationSchema);
