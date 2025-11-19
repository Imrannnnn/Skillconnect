import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  sector: { type: String, trim: true },
  description: { type: String },
  // Contact email for the organization account (typically same as org login user)
  email: { type: String, unique: true, sparse: true },
  // Primary contact phone number for the organization (optional)
  phone: { type: String },
  // Owning user account when this is a first-class organization account
  ownerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Mark this as an organization account type for clarity/queries
  accountType: { type: String, enum: ["organization"], default: "organization" },
  // Users who can manage forms, members, and exports for this organization
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Users who can submit and manage responses but not change org-level settings
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);
