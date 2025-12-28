import Booking from "../models/booking.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
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
      quantity,
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
      quantity: quantity || 1,
    };

    if (productId) bookingPayload.productId = productId;
    if (productSnapshot) {
      bookingPayload.productSnapshot = productSnapshot;
    }

    const booking = await Booking.create(bookingPayload);

    // Prepare email variables
    const createdAt = new Date(booking.createdAt).toLocaleString();
    const isProduct = booking.bookingType === "product" && booking.productSnapshot;
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

    // Ticket-style email to provider (fire-and-forget)
    try {
      const dashboardUrl = `${FRONTEND_URL}/provider/bookings`;
      const providerName = provider?.name || "Provider";
      const subject = "New booking request";

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

      sendEmail(provider.email, subject, html).catch((e) => {
        console.warn("Email send failed (provider notification)", e?.message);
      });
    } catch { }

    // Confirmation email to client (fire-and-forget)
    if (clientEmail) {
      try {
        const subject = isProduct ? "Order Confirmation" : "Booking Request Received";
        const dashboardUrl = `${FRONTEND_URL}/bookings`;

        const html = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
            <h2 style="margin-bottom: 8px;">${subject}</h2>
            <p style="margin: 0 0 12px 0;">Hi <b>${clientName}</b>, we have received your ${isProduct ? "order" : "booking request"}.</p>
            <div style="border-radius: 8px; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">Details</h3>
              <ul style="margin: 0; padding-left: 18px;">
                <li><b>Type:</b> ${isProduct ? "Product" : "Service"}</li>
                <li><b>Description:</b> ${description}</li>
                ${details ? `<li><b>Extra details:</b> ${details}</li>` : ""}
                <li><b>Requested at:</b> ${createdAt}</li>
              </ul>
            </div>
            ${productSection}
            <p style="margin: 0 0 16px 0;">The provider will review your request and get back to you shortly.</p>
            <p style="margin: 0 0 24px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;">View My Bookings</a>
            </p>
          </div>`;

        sendEmail(clientEmail, subject, html).catch((e) => {
          console.warn("Email send failed (client confirmation)", e?.message);
        });
      } catch { }
    }

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

    // When provider accepts, notify client (ticket-style, fire-and-forget)
    if (status === "successful" && booking.clientEmail) {
      try {
        const provider = await User.findById(booking.providerId).select("name");
        const providerName = provider?.name || "Provider";
        const createdAt = new Date(booking.createdAt).toLocaleString();
        const dashboardUrl = `${FRONTEND_URL}/bookings`;
        const isProduct = booking.bookingType === "product";
        const productInfo = booking.productSnapshot;

        const html = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
            <h2 style="margin-bottom: 8px;">Your booking has been accepted</h2>
            <p style="margin: 0 0 12px 0;">Your booking has been accepted by <b>${providerName}</b>.</p>
            <div style="border-radius: 8px; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">Booking details</h3>
              <ul style="margin: 0; padding-left: 18px;">
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
            <p style="margin: 0 0 12px 0;">The provider will contact you shortly using the details you provided.</p>
            <p style="margin: 0 0 16px 0;">You can view your booking status in your dashboard:</p>
            <p style="margin: 0 0 24px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;">View booking</a>
            </p>
          </div>`;

        sendEmail(
          booking.clientEmail,
          "Your booking has been accepted",
          html
        ).catch((e) => {
          console.warn("Email send failed (client notification)", e?.message);
        });
      } catch { }
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

export const updateBookingFlow = async (req, res) => {
  try {
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ message: "Action is required" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const current = booking.flowStatus || "requested";

    const transitions = {
      accept: {
        from: ["requested"],
        to: "provider_accepted",
      },
      process_order: {
        from: ["provider_accepted"],
        to: "processing",
      },
      dispatch_order: {
        from: ["processing", "provider_accepted"],
        to: "on_the_way",
      },
      on_the_way: {
        from: ["provider_accepted", "processing"],
        to: "on_the_way",
      },
      deliver_order: {
        from: ["on_the_way"],
        to: "delivered",
      },
      confirm_receipt: {
        from: ["delivered"],
        to: "job_completed",
      },
      start_job: {
        from: ["on_the_way", "provider_accepted"],
        to: "job_started",
      },
      complete_job: {
        from: ["job_started", "on_the_way", "provider_accepted", "delivered"],
        to: "job_completed",
      },
      release_payment: {
        from: ["job_completed"],
        to: "payment_released",
      },
      cancel: {
        from: ["requested", "provider_accepted", "processing"],
        to: "cancelled",
      },
      decline: {
        from: ["requested"],
        to: "declined",
      },
    };

    const rule = transitions[action];
    if (!rule) {
      return res.status(400).json({ message: "Unsupported action" });
    }
    if (!rule.from.includes(current)) {
      return res.status(400).json({ message: `Cannot apply action '${action}' from state '${current}'` });
    }

    // Escrow step: when provider accepts and a price is set, hold funds in escrow from client wallet
    if (action === "accept" && typeof booking.price === "number" && booking.price > 0 && booking.clientId) {
      const wallet = await Wallet.findOne({ user: booking.clientId });
      const balance = wallet?.balance || 0;
      if (balance < booking.price) {
        return res.status(400).json({ message: "Insufficient wallet balance to accept this booking" });
      }

      wallet.balance = balance - booking.price;
      await wallet.save();

      await Transaction.create({
        type: "escrow",
        fromUser: booking.clientId,
        toUser: booking.providerId,
        bookingId: booking._id,
        amount: booking.price,
        status: "pending",
      });
    }

    // Release step: move escrow to provider wallet when client approves payment release
    if (action === "release_payment") {
      const escrow = await Transaction.findOne({
        type: "escrow",
        bookingId: booking._id,
        status: "pending",
      });

      if (!escrow) {
        return res.status(400).json({ message: "No pending escrow found for this booking" });
      }

      const providerId = booking.providerId;
      if (providerId) {
        let providerWallet = await Wallet.findOne({ user: providerId });
        if (!providerWallet) {
          providerWallet = await Wallet.create({ user: providerId });
        }
        providerWallet.balance = (providerWallet.balance || 0) + (escrow.amount || 0);
        await providerWallet.save();
      }

      escrow.status = "completed";
      await escrow.save();
    }

    booking.flowStatus = rule.to;
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      status: rule.to,
      at: new Date(),
      by: req.user?._id || undefined,
    });

    await booking.save();

    res.json({ message: "Booking flow updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking flow", error });
  }
};
