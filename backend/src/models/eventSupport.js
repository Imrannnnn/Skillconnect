import mongoose from "mongoose";

const eventSupportSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    // Supporter can be User or Organization
    supporterId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'supporterModel' },
    supporterModel: { type: String, required: true, enum: ['User', 'Organization'], default: 'User' },

    type: {
        type: String,
        enum: ["donation", "sponsorship"],
        required: true
    },

    // If sponsorship, which tier
    tierId: { type: mongoose.Schema.Types.ObjectId }, // Points to subdoc in Event.sponsorship.tiers
    tierName: String,

    amount: { type: Number, required: true, min: 1 }, // Amount paid
    message: { type: String, maxlength: 500 }, // Optional message/dedication

    status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },

    paymentDetails: {
        transactionId: String, // Reference to Transaction model or payment provider
        paymentDate: Date
    },

    isAnonymous: { type: Boolean, default: false }

}, { timestamps: true });

export default mongoose.model("EventSupport", eventSupportSchema);
