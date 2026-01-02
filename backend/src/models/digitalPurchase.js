import mongoose from "mongoose";

const digitalPurchaseSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "DigitalProduct", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Payment Integration
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    paymentReference: { type: String }, // Paystack/Provider reference

    // Access State
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    accessStatus: {
        type: String,
        enum: ["active", "revoked", "expired"],
        default: "active"
    },

    // Usage Tracking
    pricePaid: { type: Number, required: true },
    currency: { type: String, default: "NGN" },

    downloadCount: { type: Number, default: 0 },
    lastDownloadAt: { type: Date },

    // For potential future features like "allow 3 downloads only"
    maxDownloads: { type: Number, default: 9999 },

}, { timestamps: true });

// Compound index to quickly find if a user owns a product
digitalPurchaseSchema.index({ buyerId: 1, productId: 1 });

export default mongoose.model("DigitalPurchase", digitalPurchaseSchema);
