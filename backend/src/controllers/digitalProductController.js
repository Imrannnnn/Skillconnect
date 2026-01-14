import mongoose from "mongoose";
import DigitalProduct from "../models/digitalProduct.js";
import DigitalPurchase from "../models/digitalPurchase.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";
// import { uploadFile, deleteFile, getFileStream } from "../services/storageService.js"; // Removed local storage
import Notification from "../models/notification.js";
import sendEmail from "../utils/sendEmail.js";
import { generateInvoicePDF } from "../services/invoiceService.js";
import cloudinary from "../config/cloudinary.js"; // Import cloudinary
import path from "path";

// --- Seller Actions ---

export const createProduct = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: "Not authenticated" });

        // Multer now handles upload to Cloudinary directly.
        // req.files is populated with cloudinary metadata.
        const files = req.files || {};
        const productFile = files["file"]?.[0];
        const coverFile = files["cover"]?.[0];

        if (!productFile) {
            return res.status(400).json({ message: "No product file uploaded" });
        }

        const { name, description, price, currency } = req.body;

        const product = await DigitalProduct.create({
            providerId: userId,
            name,
            description,
            price: Number(price),
            currency: currency || "NGN",
            fileKey: productFile.filename, // Cloudinary Public ID
            fileName: productFile.originalname,
            fileSize: productFile.size,
            mimeType: productFile.mimetype,
            resourceType: productFile.resource_type || "auto", // Store resource type ('image', 'video', 'raw')
            coverImage: coverFile ? coverFile.path : null, // Cloudinary Secure URL
            isActive: true,
        });

        res.status(201).json({ message: "Product created", product });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Failed to create product", error: e.message });
    }
};

export const getMyProducts = async (req, res) => {
    try {
        const userId = req.user?._id;
        const products = await DigitalProduct.find({ providerId: userId }).sort({ createdAt: -1 });
        res.json({ products });
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch products", error: e.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        const product = await DigitalProduct.findOne({ _id: id, providerId: userId });
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Try to delete from Cloudinary (Best effort)
        if (product.fileKey) {
            await cloudinary.uploader.destroy(product.fileKey, { resource_type: product.resourceType || 'raw', type: 'authenticated' }).catch(console.error);
        }
        if (product.coverImage) {
            // Need to extract public_id from URL for cover image to delete properly, 
            // but often we just leave public images or handle it if we stored the public_id separately.
            // For now, assume skipping cover deletion or implement extraction logic if strict.
        }

        await DigitalProduct.findByIdAndDelete(id);

        res.json({ message: "Product deleted" });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete product", error: e.message });
    }
};

// --- Public / Buyer Actions ---

export const getProducts = async (req, res) => {
    try {
        const { providerId, page = 1, limit = 20 } = req.query;
        const q = { isActive: { $ne: false } };
        if (providerId && providerId !== "undefined" && providerId !== "null") {
            q.providerId = providerId;
        }

        const products = await DigitalProduct.find(q)
            .populate("providerId", "name avatarUrl")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await DigitalProduct.countDocuments(q);

        res.json({ products, total, page: Number(page) });
    } catch (e) {
        res.status(500).json({ message: "Failed to list products", error: e.message });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await DigitalProduct.findById(req.params.id).populate("providerId", "name avatarUrl");
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ product });
    } catch (e) {
        res.status(500).json({ message: "Failed to get product", error: e.message });
    }
};

// --- Purchase Flow ---

export const buyProduct = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const product = await DigitalProduct.findById(id);

        if (!product || !product.isActive) {
            return res.status(404).json({ message: "Product not available" });
        }

        const existing = await DigitalPurchase.findOne({ buyerId: userId, productId: id, accessStatus: "active" });
        if (existing) {
            return res.status(409).json({ message: "You already own this product" });
        }

        const amountMinor = Math.round(product.price * 100);

        // Ensure Transaction model schema supports 'digital_purchase' or use 'ticket_purchase' fallback
        const tx = await Transaction.create({
            type: "ticket_purchase", // Using existing enum value safe-guard
            fromUser: userId,
            toUser: product.providerId,
            amount: amountMinor,
            status: "pending",
            metadata: { productId: product._id }
        });

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        const user = await User.findById(userId);
        const body = {
            amount: amountMinor,
            email: user.email,
            reference: String(tx._id),
            callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/digital/callback`,
            metadata: {
                custom_fields: [
                    { display_name: "Product", variable_name: "product_name", value: product.name },
                    { display_name: "ProductId", variable_name: "product_id", value: String(product._id) }
                ]
            }
        };

        const resp = await fetch(`https://api.paystack.co/transaction/initialize`, {
            method: "POST",
            headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const json = await resp.json();
        if (!json.status) {
            return res.status(502).json({ message: "Payment initialization failed", error: json.message });
        }

        tx.providerReference = json.data.reference;
        await tx.save();

        res.json({
            checkoutUrl: json.data.authorization_url,
            reference: json.data.reference
        });

    } catch (e) {
        res.status(500).json({ message: "Failed to initiate purchase", error: e.message });
    }
};

export const verifyPurchase = async (req, res) => {
    try {
        const { reference } = req.params;
        const userId = req.user?._id;

        let query = { providerReference: reference };
        if (mongoose.Types.ObjectId.isValid(reference)) {
            query = { $or: [{ providerReference: reference }, { _id: reference }] };
        }

        const tx = await Transaction.findOne(query);

        if (!tx) return res.status(404).json({ message: "Transaction not found" });
        if (String(tx.fromUser) !== String(userId)) return res.status(403).json({ message: "Unauthorized" });

        if (tx.status === "completed") {
            return res.json({ message: "Purchase verified", status: "paid" });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        const resp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${secretKey}` }
        });
        const json = await resp.json();

        if (json.status && json.data.status === "success") {
            tx.status = "completed";
            await tx.save();

            const productId = tx.metadata?.productId;
            if (productId) {
                const existing = await DigitalPurchase.findOne({ transactionId: tx._id });
                if (!existing) {
                    const product = await DigitalProduct.findById(productId);
                    await DigitalPurchase.create({
                        buyerId: userId,
                        productId: productId,
                        sellerId: tx.toUser,
                        transactionId: tx._id,
                        paymentReference: reference,
                        paymentStatus: "paid",
                        accessStatus: "active",
                        pricePaid: tx.amount / 100,
                        currency: "NGN"
                    });

                    await DigitalProduct.findByIdAndUpdate(productId, {
                        $inc: { salesCount: 1, totalEarnings: tx.amount / 100 }
                    });

                    const user = await User.findById(userId);
                    const isPdf = product.mimeType === 'application/pdf';
                    const productName = product.name;
                    const libraryLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-digital-library`;

                    await Notification.create({
                        userId: userId,
                        title: "Purchase Successful",
                        message: `You have successfully purchased "${productName}". It is now available in your library.`,
                        type: "success",
                        link: "/my-digital-library"
                    });

                    let emailBody = `
                        <h1>Order Confirmation</h1>
                        <p>Hi ${user.name},</p>
                        <p>Thank you for your purchase of <b>${productName}</b>.</p>
                        <p>You can access your product in your library.</p>
                        <br/>
                        <a href="${libraryLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to My Library</a>
                        <p>Reference: ${reference}</p>
                    `;

                    await sendEmail(user.email, `Order Confirmation: ${productName}`, emailBody);

                    try {
                        const seller = await User.findById(tx.toUser);
                        if (seller) {
                            const earnings = tx.amount / 100;
                            await Notification.create({
                                userId: seller._id,
                                title: "New Digital Product Sale",
                                message: `You sold "${productName}" for ₦${earnings.toLocaleString()}.`,
                                type: "success",
                                link: "/max-seller/digital"
                            });
                        }
                    } catch (e) {
                        console.error("Failed to notify seller", e);
                    }
                }
            }
            return res.json({ message: "Purchase successful", status: "paid" });
        }
        res.status(400).json({ message: "Payment verification failed", status: json.data?.status || "failed" });
    } catch (e) {
        res.status(500).json({ message: "Verification error", error: e.message });
    }
};

export const getMyLibrary = async (req, res) => {
    try {
        const userId = req.user?._id;
        const limit = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const purchases = await DigitalPurchase.find({ buyerId: userId, accessStatus: "active" })
            .populate("productId")
            .populate("sellerId", "name")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await DigitalPurchase.countDocuments({ buyerId: userId, accessStatus: "active" });

        res.json({ purchases, total, page });
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch library", error: e.message });
    }
};

export const downloadProduct = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { purchaseId } = req.params;

        const purchase = await DigitalPurchase.findOne({ _id: purchaseId, buyerId: userId });

        if (!purchase) return res.status(403).json({ message: "Purchase not found or unauthorized" });
        if (purchase.paymentStatus !== "paid") return res.status(402).json({ message: "Payment not completed" });
        if (purchase.accessStatus !== "active") return res.status(403).json({ message: "Access revoked or expired" });
        if (purchase.maxDownloads && purchase.downloadCount >= purchase.maxDownloads) {
            return res.status(403).json({ message: "Download limit exceeded" });
        }

        const product = await DigitalProduct.findById(purchase.productId);
        if (!product || !product.fileKey) return res.status(404).json({ message: "File not found" });

        purchase.downloadCount += 1;
        purchase.lastDownloadAt = new Date();
        await purchase.save();

        // Generate Signed Link for Cloudinary Authenticated Resource
        const url = cloudinary.url(product.fileKey, {
            resource_type: product.resourceType || 'auto',
            type: 'authenticated', // Important for private files
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour link
        });

        // Redirect user to the secure link
        res.redirect(url);

    } catch (e) {
        console.error("Download error:", e);
        if (!res.headersSent) {
            res.status(500).json({ message: "Download failed", error: e.message });
        }
    }
};
