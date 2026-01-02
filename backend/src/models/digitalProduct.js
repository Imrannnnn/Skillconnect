import mongoose from "mongoose";

const digitalProductSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Basic Metadata
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },

    // File details (Secure Storage)
    fileKey: { type: String, required: true }, // The private storage key (not a public URL)
    fileName: { type: String }, // Original name (e.g. "ebook.pdf")
    fileSize: { type: Number }, // In bytes
    mimeType: { type: String }, // e.g. "application/pdf"

    // Public Assets
    coverImage: { type: String }, // Public URL for cover image

    // Access Control
    isActive: { type: Boolean, default: true },

    // Analytics
    salesCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.model("DigitalProduct", digitalProductSchema);
