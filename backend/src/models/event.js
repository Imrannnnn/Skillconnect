import mongoose from "mongoose";

const ticketTypeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., Regular, VIP
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0 },
    description: String,
    salesStart: Date,
    salesEnd: Date,
});

const eventSchema = new mongoose.Schema({
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "18:00"
    venue: { type: String, required: true },
    city: { type: String, required: true },
    category: { type: String, required: true },

    // Branding
    branding: {
        logoUrl: String,
        primaryColor: { type: String, default: "#000000" },
        secondaryColor: { type: String, default: "#ffffff" },
        backgroundImageUrl: String,
    },

    ticketTypes: [ticketTypeSchema],

    status: {
        type: String,
        enum: ["draft", "published", "cancelled", "completed"],
        default: "draft"
    },

    isPublic: { type: Boolean, default: true },

}, { timestamps: true });

export default mongoose.model("Event", eventSchema);
