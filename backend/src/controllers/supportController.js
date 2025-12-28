import Event from "../models/event.js";
import EventSupport from "../models/eventSupport.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import Organization from "../models/organization.js";
import User from "../models/user.js";

// Helper to ensure wallet exists
async function ensureWallet(userId) {
    if (!userId) return null;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = await Wallet.create({ user: userId });
    }
    return wallet;
}

export const supportEvent = async (req, res) => {
    try {
        const { eventId, amount, type, tierId, message, isAnonymous } = req.body;
        const userId = req.user._id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Check if sponsorship/donation is enabled
        if (event.organizerModel === 'Organization' && !event.sponsorship?.enabled) {
            return res.status(400).json({ message: "This event is not accepting support" });
        }

        // Validate Tier if sponsorship
        let tierName = "";
        if (type === 'sponsorship') {
            const tier = event.sponsorship.tiers.id(tierId);
            if (!tier) return res.status(400).json({ message: "Invalid sponsorship tier" });
            if (amount < tier.amount) return res.status(400).json({ message: `Minimum amount for ${tier.name} is ${tier.amount}` });
            tierName = tier.name;
        }

        // 1. Process Payment (Wallet)
        const userWallet = await ensureWallet(userId);
        if (userWallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        // Determine recipient (Organizer Owner)
        let recipientUserId = event.organizerId;
        if (event.organizerModel === 'Organization') {
            const org = await Organization.findById(event.organizerId);
            if (!org || !org.ownerUser) {
                return res.status(500).json({ message: "Organization owner not found" });
            }
            recipientUserId = org.ownerUser;
        }

        // Prevent self-support
        if (recipientUserId.toString() === userId.toString()) {
            return res.status(400).json({ message: "You cannot support your own event" });
        }

        const recipientWallet = await ensureWallet(recipientUserId);

        // Deduct from sender
        userWallet.balance -= amount;
        await userWallet.save();

        // Credit recipient
        recipientWallet.balance += amount;
        await recipientWallet.save();

        // Create Transaction Record
        await Transaction.create({
            type: "event_support", // Need to ensure this enum is supported or just use string
            fromUser: userId,
            toUser: recipientUserId,
            amount: amount,
            status: "completed",
            metadata: {
                eventId: event._id,
                supportType: type,
                tierName
            }
        });

        // 2. Create EventSupport Record
        const support = new EventSupport({
            eventId: event._id,
            supporterId: userId,
            supporterModel: 'User', // Currently only users support
            type,
            tierId,
            tierName,
            amount,
            message,
            status: 'paid',
            isAnonymous
        });
        await support.save();

        // 3. Update Event Raised Amount
        if (event.sponsorship) {
            event.sponsorship.raised = (event.sponsorship.raised || 0) + amount;
            await event.save();
        }

        res.status(201).json({ message: "Support successful", support });

    } catch (error) {
        console.error("Support error:", error);
        res.status(500).json({ message: "Failed to process support", error: error.message });
    }
};

export const getEventSupporters = async (req, res) => {
    try {
        const { eventId } = req.params;
        const supports = await EventSupport.find({ eventId, status: 'paid' })
            .populate("supporterId", "name avatarUrl")
            .sort({ createdAt: -1 });

        // Filter anonymous
        const sanitized = supports.map(s => {
            if (s.isAnonymous) {
                s.supporterId = { name: "Anonymous" };
            }
            return s;
        });

        res.status(200).json(sanitized);
    } catch (error) {
        res.status(500).json({ message: "Error fetching supporters", error: error.message });
    }
};
