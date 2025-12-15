import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Points to subdoc in Event

    uniqueTicketId: { type: String, required: true, unique: true }, // Human readable ID e.g. EVT-12345
    qrCodeData: { type: String, required: true }, // Data encoded in QR (could be uniqueTicketId or signed token)

    holderName: { type: String, required: true }, // Could be buyer or assigned guest

    status: {
        type: String,
        enum: ["valid", "checked-in", "cancelled"],
        default: "valid"
    },

    checkInTime: Date,

}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
