import Event from "../models/event.js";
import User from "../models/user.js";

// Create a new event
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            time,
            venue,
            city,
            category,
            branding,
            ticketTypes,
        } = req.body;

        const newEvent = new Event({
            organizerId: req.user._id,
            title,
            description,
            date,
            time,
            venue,
            city,
            category,
            branding,
            ticketTypes,
            status: "published", // Auto-publish for now, or use draft
        });

        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error: error.message });
    }
};

// Get all public events or filter by organizer
export const getEvents = async (req, res) => {
    try {
        const { organizerId, city, category } = req.query;
        const query = { status: "published" };

        if (organizerId) query.organizerId = organizerId;
        if (city) query.city = city;
        if (category) query.category = category;

        const events = await Event.find(query).sort({ date: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error: error.message });
    }
};

// Get single event by ID
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate("organizerId", "name avatarUrl");
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error fetching event", error: error.message });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Check ownership
        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this event" });
        }

        Object.assign(event, req.body);
        await event.save();
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error updating event", error: error.message });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this event" });
        }

        await event.deleteOne();
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error: error.message });
    }
};

// Get events for the logged-in organizer
export const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching your events", error: error.message });
    }
};
