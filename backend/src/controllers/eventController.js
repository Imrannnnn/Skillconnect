import Event from "../models/event.js";
import User from "../models/user.js";
import { deleteFromCloudinary } from "../services/cloudinaryService.js";

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
            organizerId, // Optional, if creating for an org
            organizerModel, // 'Organization' or 'User'
            sponsorship,
        } = req.body;

        // Default to user if not specified
        let finalOrganizerId = req.user._id;
        let finalOrganizerModel = 'User';

        if (organizerId && organizerModel === 'Organization') {
            // Verify user is admin/owner of the org
            // Ideally import Organization model and check, but for now assuming middleware or simple check
            // For MVP, we trust the ID if the user is associated (should be validated)
            finalOrganizerId = organizerId;
            finalOrganizerModel = 'Organization';
        }

        const newEvent = new Event({
            organizerId: finalOrganizerId,
            organizerModel: finalOrganizerModel,
            title,
            description,
            date,
            time,
            venue,
            city,
            category,
            branding,
            ticketTypes,
            sponsorship: finalOrganizerModel === 'Organization' ? sponsorship : undefined,
            status: "published", // Auto-publish for now
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
        const event = await Event.findById(req.params.id).populate("organizerId", "name avatarUrl logo");
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
        // If organizer is User, check ID. If Organization, check if user is admin (simplified for now)
        if (event.organizerModel === 'User' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this event" });
        }
        // TODO: Add check for Organization ownership if organizerModel is Organization

        // Cloudinary cleanup for branding images
        if (req.body.branding) {
            const oldBranding = event.branding || {};
            const newBranding = req.body.branding;
            if (newBranding.logoUrl !== undefined && oldBranding.logoUrl && oldBranding.logoUrl !== newBranding.logoUrl) {
                await deleteFromCloudinary(oldBranding.logoUrl).catch(console.error);
            }
            if (newBranding.backgroundImageUrl !== undefined && oldBranding.backgroundImageUrl && oldBranding.backgroundImageUrl !== newBranding.backgroundImageUrl) {
                await deleteFromCloudinary(oldBranding.backgroundImageUrl).catch(console.error);
            }
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

        if (event.organizerModel === 'User' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this event" });
        }
        // TODO: Add check for Organization ownership

        // Cloudinary cleanup
        if (event.branding) {
            if (event.branding.logoUrl) await deleteFromCloudinary(event.branding.logoUrl).catch(console.error);
            if (event.branding.backgroundImageUrl) await deleteFromCloudinary(event.branding.backgroundImageUrl).catch(console.error);
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
        // Find events where organizer is the user OR an organization the user manages
        // For now, just return user's events. Frontend can request org events separately.
        const events = await Event.find({ organizerId: req.user._id, organizerModel: 'User' }).sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching your events", error: error.message });
    }
};
