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
            status: req.body.status || "published",
            isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
        });

        await newEvent.save();

        if (newEvent.status === "published") {
            await notifySubscribers(newEvent);
        }

        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error: error.message });
    }
};

// Get all public events or filter by organizer
export const getEvents = async (req, res) => {
    try {
        const { organizerId, city, category } = req.query;
        const query = { status: "published", isPublic: true };

        if (organizerId) query.organizerId = organizerId;
        if (city) query.city = city;
        if (category) query.category = category;

        const events = await Event.find(query).sort({ date: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error: error.message });
    }
};

// Get single event by ID or Access Key
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const { accessKey } = req.query;

        let event;
        if (id.length === 24) { // Likely direct ID
            event = await Event.findById(id).populate("organizerId", "name avatarUrl");
        }

        if (!event && accessKey) {
            event = await Event.findOne({ accessKey }).populate("organizerId", "name avatarUrl");
        }

        if (!event) return res.status(404).json({ message: "Event not found" });

        // If private, check if user has access (either creator or has accessKey)
        if (!event.isPublic && !accessKey) {
            // Check if user is organizer
            if (!req.user || event.organizerId._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "This is a private event. You need a private link to access it." });
            }
        }

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

        const wasPublished = event.status === 'published';
        Object.assign(event, req.body);
        await event.save();

        if (event.status === 'published' && !wasPublished) {
            await notifySubscribers(event);
        }

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

import Notification from "../models/notification.js";

// Helper: Notify users subscribed to the event category
const notifySubscribers = async (event) => {
    try {
        // Find users who have this category in their profile and have not opted out (assuming they opted in by adding category)
        const subscribers = await User.find({
            categories: event.category,
            _id: { $ne: event.organizerId } // Don't notify the organizer
        });

        if (subscribers.length === 0) return;

        const notifications = subscribers.map(user => ({
            userId: user._id,
            title: "New Event: " + event.title,
            message: `A new event in the ${event.category} category is now available: ${event.title}. Check it out!`,
            type: "info",
            link: `/events/${event._id}`,
            metadata: { eventId: event._id, category: event.category }
        }));

        await Notification.insertMany(notifications);
        console.log(`Sent notifications to ${subscribers.length} subscribers for category: ${event.category}`);
    } catch (error) {
        console.error("Error notifying subscribers:", error);
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
