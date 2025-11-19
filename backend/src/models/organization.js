import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  sector: { type: String, trim: true },
  description: { type: String },
  // Users who can manage forms, members, and exports for this organization
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Users who can submit and manage responses but not change org-level settings
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);
