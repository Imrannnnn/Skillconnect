import Booking from "../models/booking.js";
import User from "../models/user.js";
import sendEmail from "../utils/sendEmail.js";

export const createBooking = async (req, res) => {
  try {
    const { providerId, clientId, clientName, clientPhone, description, address, details } = req.body;
    if (!providerId || !clientName || !clientPhone || !description) return res.status(400).json({ message: "providerId, clientName, clientPhone and description are required" });
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== "provider") return res.status(404).json({ message: "Provider not found" });
    const booking = await Booking.create({ providerId, clientId, clientName, clientPhone, description, address, details });
    try {
      await sendEmail(provider.email, "New booking request",
        `<p>Hello ${provider.name || "Provider"},</p>
         <p>You have a new booking request:</p>
         <ul>
           <li><b>Client:</b> ${clientName}</li>
           <li><b>Phone:</b> ${clientPhone}</li>
           <li><b>Description:</b> ${description}</li>
           ${address ? `<li><b>Address:</b> ${address}</li>` : ""}
           ${details ? `<li><b>Details:</b> ${details}</li>` : ""}
         </ul>`);
    } catch {}
    res.status(201).json({ message: "Booking created", booking });
  } catch (error) { res.status(500).json({ message: "Failed to create booking", error }); }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','declined','successful'].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking updated", booking });
  } catch (error) { res.status(500).json({ message: "Failed to update booking", error }); }
};

export const listBookings = async (req, res) => {
  try {
    const { providerId, clientId } = req.query;
    const q = {};
    if (providerId) q.providerId = providerId;
    if (clientId) q.clientId = clientId;
    const bookings = await Booking.find(q).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) { res.status(500).json({ message: "Failed to fetch bookings", error }); }
};
