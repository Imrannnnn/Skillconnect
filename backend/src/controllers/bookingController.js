import Booking from "../models/booking.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import sendEmail from "../utils/sendEmail.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      clientId: rawClientId,
      clientName,
      clientPhone,
      description,
      address,
      details,
      bookingType,
      productId,
    } = req.body;

    if (!providerId || !clientName || !clientPhone || !description) {
      return res.status(400).json({ message: "providerId, clientName, clientPhone and description are required" });
    }

    const provider = await User.findById(providerId);
    if (!provider || provider.role !== "provider") {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Normalise clientId: prefer body, otherwise authenticated user
    let effectiveClientId = rawClientId;
    if (!effectiveClientId && req.user?._id) {
      effectiveClientId = req.user._id;
    }

    // Try to enrich booking with client email from auth when available
    let clientEmail = undefined;
    if (effectiveClientId) {
      const c = await User.findById(effectiveClientId).select("email");
      clientEmail = c?.email;
    } else if (req.user?._id) {
      const c = await User.findById(req.user._id).select("email");
      clientEmail = c?.email;
    }

    let productSnapshot;
    if (bookingType === "product" && productId) {
      const product = await Product.findById(productId);
      if (product) {
        productSnapshot = {
          productId: product._id,
          productCode: product.productCode,
          name: product.name,
          category: product.category,
          price: product.price,
          discountPrice: product.discountPrice,
          currency: product.currency,
          image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
        };
      }
    }

    const bookingPayload = {
      providerId,
      clientId: effectiveClientId,
      clientName,
      clientPhone,
      clientEmail,
      description,
      address,
      details,
      bookingType: bookingType === "product" ? "product" : "service",
    };

    if (productId) bookingPayload.productId = productId;
    if (productSnapshot) {
      bookingPayload.productSnapshot = productSnapshot;
    }

    const booking = await Booking.create(bookingPayload);

    // Ticket-style email to provider
    try {
      const dashboardUrl = `${FRONTEND_URL}/provider/bookings`;
      const createdAt = new Date(booking.createdAt).toLocaleString();
      const isProduct = booking.bookingType === "product" && booking.productSnapshot;

      const providerName = provider?.name || "Provider";
      const subject = "New booking request";
      const productSection = isProduct
        ? `<div style="margin: 12px 0; padding: 8px 10px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="font-weight: 600; margin-bottom: 4px;">Product details</div>
            <div style="font-size: 13px;">
              <div><strong>Name:</strong> ${booking.productSnapshot.name || ""}</div>
              ${booking.productSnapshot.productCode ? `<div><strong>Product ID:</strong> ${booking.productSnapshot.productCode}</div>` : ""}
              ${typeof booking.productSnapshot.price === "number" ? `<div><strong>Price:</strong> ₦${booking.productSnapshot.price.toLocaleString()}</div>` : ""}
            </div>
          </div>`
        : "";

      const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
          <h2 style="margin-bottom: 8px;">New booking request</h2>
          <p style="margin: 0 0 12px 0;">You have a new ${isProduct ? "product" : "service"} booking from <b>${clientName || "a SkillConnect user"}</b>.</p>
          <div style="border-radius: 8px; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px;">Client details</h3>
            <ul style="margin: 0; padding-left: 18px;">
              <li><b>Name:</b> ${clientName}</li>
              <li><b>Phone:</b> ${clientPhone}</li>
              ${clientEmail ? `<li><b>Email:</b> ${clientEmail}</li>` : ""}
              ${address ? `<li><b>Address:</b> ${address}</li>` : ""}
            </ul>
          </div>
          <div style="border-radius: 8px; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px;">Booking details</h3>
            <ul style="margin: 0; padding-left: 18px;">
              <li><b>Type:</b> ${isProduct ? "Product" : "Service"}</li>
              <li><b>Description:</b> ${description}</li>
              ${details ? `<li><b>Extra details:</b> ${details}</li>` : ""}
              <li><b>Requested at:</b> ${createdAt}</li>
            </ul>
          </div>
          ${productSection}
          <p style="margin: 0 0 16px 0;">To accept or decline this request, open your booking dashboard:</p>
          <p style="margin: 0 0 24px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;">Go to Booking Dashboard</a>
          </p>
        </div>`;

      await sendEmail(provider.email, subject, html);
    } catch {}

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to create booking", error });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "declined", "successful"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // When provider accepts, notify client (ticket-style)
    if (status === "successful" && booking.clientEmail) {
      try {
        const provider = await User.findById(booking.providerId).select("name");
        const providerName = provider?.name || "Provider";
        const createdAt = new Date(booking.createdAt).toLocaleString();
        const dashboardUrl = `${FRONTEND_URL}/bookings`;
        const isProduct = booking.bookingType === "product";
        const productInfo = booking.productSnapshot;

        const html = `
          <div style=\"font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;\">
            <h2 style=\"margin-bottom: 8px;\">Your booking has been accepted</h2>
            <p style=\"margin: 0 0 12px 0;\">Your booking has been accepted by <b>${providerName}</b>.</p>
            <div style=\"border-radius: 8px; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px;\">
              <h3 style=\"margin: 0 0 8px 0; font-size: 14px;\">Booking details</h3>
              <ul style=\"margin: 0; padding-left: 18px;\">
                <li><b>Type:</b> ${isProduct ? "Product" : "Service"}</li>
                <li><b>Description:</b> ${booking.description}</li>
                ${booking.details ? `<li><b>Extra details:</b> ${booking.details}</li>` : ""}
                <li><b>Requested at:</b> ${createdAt}</li>
                ${productInfo ? `
                  ${productInfo.productCode ? `<li><b>Product ID:</b> ${productInfo.productCode}</li>` : ""}
                  ${productInfo.name ? `<li><b>Product name:</b> ${productInfo.name}</li>` : ""}
                  ${typeof productInfo.price === "number" ? `<li><b>Price (snapshot):</b> ${productInfo.price}</li>` : ""}
                ` : ""}
              </ul>
            </div>
            <p style=\"margin: 0 0 12px 0;\">The provider will contact you shortly using the details you provided.</p>
            <p style=\"margin: 0 0 16px 0;\">You can view your booking status in your dashboard:</p>
            <p style=\"margin: 0 0 24px 0;\">
              <a href=\"${dashboardUrl}\" style=\"display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;\">View booking</a>
            </p>
          </div>`;

        await sendEmail(
          booking.clientEmail,
          "Your booking has been accepted",
          html
        );
      } catch {}
    }

    res.json({ message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking", error });
  }
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
