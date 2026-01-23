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
    // Organizer can be User or Organization
    organizerId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'organizerModel' },
    organizerModel: { type: String, required: true, enum: ['User', 'Organization'], default: 'User' },

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

    // Sponsorship & Donations (Only for Organizations)
    sponsorship: {
        enabled: { type: Boolean, default: false },
        goal: { type: Number, default: 0 },
        raised: { type: Number, default: 0 },
        tiers: [{
            name: { type: String, required: true },
            amount: { type: Number, required: true },
            benefits: [String],
            color: String
        }]
    },

    status: {
        type: String,
        enum: ["draft", "published", "cancelled", "completed"],
        default: "draft"
    },

    isPublic: { type: Boolean, default: true },
    accessKey: { type: String, unique: true, sparse: true }, // For private events URL

}, { timestamps: true });

// Pre-save hook to generate accessKey if private
eventSchema.pre("save", function (next) {
    if (!this.isPublic && !this.accessKey) {
        this.accessKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    next();
});

export default mongoose.model("Event", eventSchema);
