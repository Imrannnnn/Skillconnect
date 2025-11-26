import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  // Optional short one-line tagline for the organization
  tagline: { type: String, trim: true },
  sector: { type: String, trim: true },
  description: { type: String },
  // Contact email for the organization account (typically same as org login user)
  email: { type: String, unique: true, sparse: true },
  // Primary contact phone number for the organization (optional)
  phone: { type: String },
  // Optional public website URL for the organization
  website: { type: String },
  // Optional logo image URL for the organization
  logo: { type: String },
  // Optional human-readable address for the organization
  address: { type: String },
  // Simple structured sections for public organization profile
  services: [
    {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
  ],
  teamMembers: [
    {
      name: { type: String, trim: true },
      role: { type: String, trim: true },
      photoUrl: { type: String, trim: true },
      bio: { type: String, trim: true },
    },
  ],
  achievements: [
    { type: String, trim: true },
  ],
  projects: [
    { type: String, trim: true },
  ],
  ratingScore: { type: Number, min: 0, max: 5 },
  ratingCount: { type: Number, min: 0 },
  reviews: [
    {
      author: { type: String, trim: true },
      roleOrOrg: { type: String, trim: true },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
    },
  ],
  partners: [
    {
      name: { type: String, trim: true },
      logo: { type: String, trim: true },
      website: { type: String, trim: true },
    },
  ],
  media: [
    {
      type: { type: String, enum: ["image", "video"], default: "image" },
      url: { type: String, trim: true },
      title: { type: String, trim: true },
    },
  ],
  certificates: [
    {
      name: { type: String, trim: true },
      issuer: { type: String, trim: true },
      year: { type: String, trim: true },
      link: { type: String, trim: true },
    },
  ],
  updates: [
    {
      title: { type: String, trim: true },
      content: { type: String, trim: true },
      date: { type: String, trim: true },
    },
  ],
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
