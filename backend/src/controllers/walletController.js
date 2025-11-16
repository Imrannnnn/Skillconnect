import crypto from "crypto";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

async function ensureWallet(userId) {
  if (!userId) return null;
  const existing = await Wallet.findOne({ user: userId });
  if (existing) return existing;
  const created = await Wallet.create({ user: userId });
  return created;
}

export const getMyWallet = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const wallet = await ensureWallet(userId);
    res.json({ wallet });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch wallet", error: e?.message || e });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const q = {
      $or: [
        { fromUser: userId },
        { toUser: userId },
      ],
    };

    const [items, total] = await Promise.all([
      Transaction.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(q),
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch transactions", error: e?.message || e });
  }
};

export const initiateFundWallet = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const { amount } = req.body || {};
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const amountMinor = Math.round(amt * 100); // convert to kobo

    const tx = await Transaction.create({
      type: "fund",
      fromUser: userId,
      amount: amountMinor,
      status: "pending",
    });

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const paystackBase = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!secretKey) {
      return res.status(201).json({
        message: "Funding transaction created (Paystack key missing, manual integration required)",
        transactionId: tx._id,
        reference: String(tx._id),
        checkoutUrl: null,
      });
    }

    const user = await User.findById(userId).select("email");
    const email = user?.email;

    const body = {
      amount: amountMinor,
      reference: String(tx._id),
      callback_url: `${frontendUrl}/wallet/callback`,
    };
    if (email) body.email = email;

    const resp = await fetch(`${paystackBase}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json?.status) {
      return res.status(502).json({
        message: "Failed to initialize Paystack transaction",
        error: json || resp.statusText,
      });
    }

    tx.providerReference = json.data?.reference || String(tx._id);
    await tx.save();

    res.status(201).json({
      message: "Funding transaction created",
      transactionId: tx._id,
      reference: tx.providerReference,
      checkoutUrl: json.data?.authorization_url || null,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to initiate funding", error: e?.message || e });
  }
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(200).json({ received: true, skipped: true });
    }

    const signature = req.headers["x-paystack-signature"]; // eslint-disable-line dot-notation
    if (!signature) {
      return res.status(400).json({ message: "Missing signature" });
    }

    const bodyString = JSON.stringify(req.body || {});
    const hash = crypto.createHmac("sha512", secretKey).update(bodyString).digest("hex");
    if (hash !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body;
    const ref = event?.data?.reference;
    if (event?.event === "charge.success" && ref) {
      const tx = await Transaction.findOne({ providerReference: ref, type: "fund" });
      if (tx && tx.status !== "completed") {
        tx.status = "completed";
        await tx.save();

        const wallet = await ensureWallet(tx.fromUser);
        if (wallet) {
          wallet.balance = (wallet.balance || 0) + (tx.amount || 0);
          await wallet.save();
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (e) {
    res.status(200).json({ received: true, error: e?.message || e });
  }
};
