import Order from "../models/order.js";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { generateTicketPDF } from "../utils/pdfGenerator.js";

// Helper to generate unique ticket ID
const generateTicketId = () => {
    return "TKT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

// Purchase tickets
export const purchaseTickets = async (req, res) => {
    try {
        const { eventId, items, guestDetails, paymentDetails } = req.body;
        // items: [{ ticketTypeId, quantity }]

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        let totalAmount = 0;
        const orderItems = [];

        // Validate items and calculate total
        for (const item of items) {
            const ticketType = event.ticketTypes.id(item.ticketTypeId);
            if (!ticketType) {
                return res.status(400).json({ message: `Invalid ticket type ID: ${item.ticketTypeId}` });
            }

            if (ticketType.quantity - ticketType.sold < item.quantity) {
                return res.status(400).json({ message: `Not enough tickets for ${ticketType.name}` });
            }

            totalAmount += ticketType.price * item.quantity;
            orderItems.push({
                ticketTypeId: item.ticketTypeId,
                quantity: item.quantity,
                price: ticketType.price
            });
        }

        // Create Order
        const order = new Order({
            eventId,
            buyerId: req.user ? req.user._id : null,
            guestDetails: req.user ? null : guestDetails,
            items: orderItems,
            totalAmount,
            status: "paid", // Assume payment is successful for now (mock)
            paymentDetails: {
                ...paymentDetails,
                paymentDate: new Date(),
            }
        });

        await order.save();

        // Generate Tickets and Update Sold Count
        const tickets = [];
        for (const item of orderItems) {
            const ticketType = event.ticketTypes.id(item.ticketTypeId);

            // Update sold count
            ticketType.sold += item.quantity;

            for (let i = 0; i < item.quantity; i++) {
                const uniqueId = generateTicketId();
                const ticket = new Ticket({
                    orderId: order._id,
                    eventId,
                    ticketTypeId: item.ticketTypeId,
                    uniqueTicketId: uniqueId,
                    qrCodeData: uniqueId, // In real app, sign this data
                    holderName: req.user ? req.user.name : guestDetails.name,
                    status: "valid"
                });
                await ticket.save();
                tickets.push(ticket);
            }
        }

        await event.save();

        // Send Email Confirmation
        const email = req.user ? req.user.email : guestDetails.email;
        if (email) {
            const ticketLinks = tickets.map(t =>
                `<p>Ticket (${t.uniqueTicketId}): <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${t.uniqueTicketId}">View Ticket</a></p>`
            ).join("");

            const html = `
                <h1>Order Confirmation</h1>
                <p>Thank you for your purchase for <strong>${event.title}</strong>.</p>
                <p>Total Paid: $${totalAmount}</p>
                <h3>Your Tickets:</h3>
                ${ticketLinks}
                <p>Please present the QR code from the ticket link or the attached PDF at the entrance.</p>
            `;

            // Generate PDFs
            const attachments = [];
            for (const ticket of tickets) {
                const ticketType = event.ticketTypes.id(ticket.ticketTypeId);
                const ticketWithDetails = { ...ticket.toObject(), ticketType: ticketType.toObject() };

                try {
                    const pdfBuffer = await generateTicketPDF(ticketWithDetails, event);
                    attachments.push({
                        content: pdfBuffer.toString("base64"),
                        filename: `Ticket-${ticket.uniqueTicketId}.pdf`,
                        type: "application/pdf",
                        disposition: "attachment"
                    });
                } catch (err) {
                    console.error("Error generating PDF for ticket", ticket.uniqueTicketId, err);
                }
            }

            try {
                await sendEmail(email, `Your Tickets for ${event.title}`, html, attachments);
            } catch (err) {
                console.error("Failed to send email", err);
            }
        }

        res.status(201).json({ order, tickets });

    } catch (error) {
        res.status(500).json({ message: "Error purchasing tickets", error: error.message });
    }
};

// Get ticket by ID (for view)
export const getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ uniqueTicketId: req.params.id })
            .populate("eventId")
            .populate("orderId");

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Find ticket type name from event
        const event = ticket.eventId;
        const ticketType = event.ticketTypes.id(ticket.ticketTypeId);

        res.status(200).json({ ticket, ticketType });
    } catch (error) {
        res.status(500).json({ message: "Error fetching ticket", error: error.message });
    }
};

// Check-in ticket
export const checkInTicket = async (req, res) => {
    try {
        const { ticketId } = req.body; // uniqueTicketId
        const ticket = await Ticket.findOne({ uniqueTicketId: ticketId });

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.status === "checked-in") {
            return res.status(400).json({ message: "Ticket already checked in", ticket });
        }

        if (ticket.status === "cancelled") {
            return res.status(400).json({ message: "Ticket is cancelled", ticket });
        }

        // Verify if the user is the organizer of the event
        const event = await Event.findById(ticket.eventId);
        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to check in this ticket" });
        }

        ticket.status = "checked-in";
        ticket.checkInTime = new Date();
        await ticket.save();

        res.status(200).json({ message: "Check-in successful", ticket });
    } catch (error) {
        res.status(500).json({ message: "Error checking in", error: error.message });
    }
};

// Get analytics for an event
export const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const tickets = await Ticket.find({ eventId });
        const orders = await Order.find({ eventId });

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const ticketsSold = tickets.length;
        const checkedInCount = tickets.filter(t => t.status === "checked-in").length;

        res.status(200).json({
            totalRevenue,
            ticketsSold,
            checkedInCount,
            ticketTypes: event.ticketTypes
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
};

// Download ticket PDF
export const downloadTicketPDF = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ uniqueTicketId: req.params.id }).populate("eventId");
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const event = ticket.eventId;
        const ticketType = event.ticketTypes.id(ticket.ticketTypeId);
        const ticketWithDetails = { ...ticket.toObject(), ticketType: ticketType.toObject() };

        const pdfBuffer = await generateTicketPDF(ticketWithDetails, event);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Ticket-${ticket.uniqueTicketId}.pdf"`,
            "Content-Length": pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: "Error generating PDF", error: error.message });
    }
};

// Get all tickets for logged in user
export const getMyTickets = async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user._id });
        const orderIds = orders.map(o => o._id);

        const tickets = await Ticket.find({ orderId: { $in: orderIds } })
            .populate("eventId")
            .sort({ createdAt: -1 });

        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: "Error fetching your tickets", error: error.message });
    }
};
