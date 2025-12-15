import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional, for logged-in users

    // Guest details (if buyerId is null)
    guestDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
    },

    items: [{
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Price at time of purchase
    }],

    totalAmount: { type: Number, required: true },

    status: {
        type: String,
        enum: ["pending", "paid", "cancelled", "refunded"],
        default: "pending"
    },

    paymentDetails: {
        transactionId: String,
        paymentMethod: String,
        paymentDate: Date,
    },

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
