import User from "../models/user.js";
import Booking from "../models/booking.js";
import Message from "../models/message.js";
import Transaction from "../models/transaction.js";
import Wallet from "../models/wallet.js";
import Product from "../models/product.js";
import FormDefinition from "../models/formDefinition.js";
import FormResponse from "../models/formResponse.js";
import Organization from "../models/organization.js";
import sendEmail from "../utils/sendEmail.js";
export const getUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "Not found" });
    res.json(u);
  } catch (e) { res.status(500).json({ message: "Failed to get user", error: e }); }
};

export const listUsers = async (req, res) => {
  try {
    const { role, category, providerType, city, state, country } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (category) filter.categories = { $regex: new RegExp(category, "i") };
    if (providerType) filter.providerType = providerType;
    if (city) filter.city = { $regex: new RegExp(city, "i") };
    if (state) filter.state = { $regex: new RegExp(state, "i") };
    if (country) filter.country = { $regex: new RegExp(country, "i") };
    const users = await User.find(filter).sort({ ratingAvg: -1, ratingCount: -1, createdAt: -1 });
    res.json({ users });
  } catch (e) { res.status(500).json({ message: "Failed to list users", error: e }); }
};

// Simple keyword extraction from a free-text query
function extractKeywords(raw) {
  if (!raw || typeof raw !== "string") return [];
  const lower = raw.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/g).filter(Boolean);
  const stopwords = new Set([
    "i","need","someone","somebody","to","for","and","the","a","an","my","our","with","on","in","of","is","it","that","this","please","help"
  ]);
  const keywords = tokens.filter((t) => t.length > 2 && !stopwords.has(t));
  // De-duplicate
  return Array.from(new Set(keywords));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const smartSearchProviders = async (req, res) => {
  try {
    const { query, lat, lng, radiusKm } = req.body || {};
    const keywords = extractKeywords(query);

    // Base filter: providers only
    const filter = { role: "provider" };

    // If we have some keywords, do a loose pre-filter on categories / name / bio
    if (keywords.length) {
      const regex = new RegExp(keywords.join("|"), "i");
      filter.$or = [
        { categories: { $regex: regex } },
        { name: { $regex: regex } },
        { bio: { $regex: regex } },
      ];
    }

    let providers = await User.find(filter).lean();
    if (!providers.length) {
      return res.json({ providers: [] });
    }

    // Pre-compute global maxima for normalization
    const maxRatingCount = providers.reduce((m, p) => Math.max(m, Number(p.ratingCount || 0)), 0) || 1;

    const latNum = typeof lat === "number" ? lat : Number(lat);
    const lngNum = typeof lng === "number" ? lng : Number(lng);
    const radiusNum = typeof radiusKm === "number" ? radiusKm : Number(radiusKm);
    const hasClientCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

    const keywordSet = new Set(keywords);

    providers = providers
      .map((p) => {
        // Keyword relevance: count overlaps across categories, name, bio
        let keywordMatches = 0;
        const catArr = Array.isArray(p.categories) ? p.categories : [];
        const haystackParts = [
          ...catArr.map((c) => String(c || "").toLowerCase()),
          String(p.name || "").toLowerCase(),
          String(p.bio || "").toLowerCase(),
        ];
        const haystackJoined = haystackParts.join(" ");
        keywordSet.forEach((kw) => {
          if (kw && haystackJoined.includes(kw)) keywordMatches += 1;
        });
        const keywordScore = keywords.length ? keywordMatches / keywords.length : 0.3; // small base if no query

        // Rating & experience proxies
        const rating = Number(p.ratingAvg || 0);
        const ratingScore = Math.min(Math.max(rating / 5, 0), 1);
        const count = Number(p.ratingCount || 0);
        const experienceScore = Math.min(count / maxRatingCount, 1);

        // Trust & verification score: reward verified / trusted / top performers
        const v = p.verification || {};
        const emailVerified = v.emailVerified ? 1 : 0;
        const phoneVerified = v.phoneVerified ? 1 : 0;
        const idVerified = v.idVerified ? 1 : 0;
        const trusted = v.trustedProvider ? 1 : 0;
        const topPerfCount = Array.isArray(v.topPerformerMonths) ? v.topPerformerMonths.length : 0;

        // cap top-performer effect so it doesn't dominate
        const topPerfScore = Math.min(topPerfCount / 6, 1); // full score after ~6 months tagged
        const rawTrust =
          emailVerified * 0.15 +
          phoneVerified * 0.1 +
          idVerified * 0.25 +
          trusted * 0.3 +
          topPerfScore * 0.2;
        const trustScore = Math.max(0, Math.min(1, rawTrust));

        // Distance (if client coords + provider coords available)
        let distanceKm = null;
        let distanceScore = 0;
        const plat = Number(p.latitude ?? p?.location?.latitude);
        const plng = Number(p.longitude ?? p?.location?.longitude);
        if (hasClientCoords && Number.isFinite(plat) && Number.isFinite(plng)) {
          distanceKm = haversineKm(latNum, lngNum, plat, plng);
          // If radius is specified, drop providers far outside radius
          if (Number.isFinite(radiusNum) && radiusNum > 0 && distanceKm > radiusNum * 2) {
            // soft filter later via score
          }
          const maxConsidered = Number.isFinite(radiusNum) && radiusNum > 0 ? radiusNum : 50;
          const normalized = Math.max(0, Math.min(1, 1 - (distanceKm / maxConsidered)));
          distanceScore = normalized;
        }

        // Combine scores with weights (acts as an AI-style recommender)
        const wKeyword = 0.4;
        const wRating = 0.2;
        const wExperience = 0.15;
        const wDistance = 0.15;
        const wTrust = 0.1;
        const totalScore =
          wKeyword * keywordScore +
          wRating * ratingScore +
          wExperience * experienceScore +
          wDistance * distanceScore +
          wTrust * trustScore;

        return {
          ...p,
          __matchScore: Number(totalScore.toFixed(4)),
          __distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(1)) : undefined,
        };
      })
      .sort((a, b) => b.__matchScore - a.__matchScore);

    // If radius is given and client coords known, apply a final hard filter to keep list focused
    if (hasClientCoords && Number.isFinite(radiusNum) && radiusNum > 0) {
      providers = providers.filter((p) => {
        if (typeof p.__distanceKm !== "number") return true;
        return p.__distanceKm <= radiusNum;
      });
    }

    res.json({ providers });
  } catch (e) {
    res.status(500).json({ message: "Failed to smart-search providers", error: e?.message || e });
  }
};

// Lightweight AI-style assistant without external APIs.
// Interprets a free-text message into intents and suggestions that the frontend can turn into actions.
export const aiChatAssistant = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "message is required" });
    }

    const text = message.trim();
    const lower = text.toLowerCase();
    const keywords = extractKeywords(text);

    // Short messages like just "hi" or "hello"
    const isGreetingOnly = /^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(lower) && keywords.length === 0;

    // Basic intent classification (order matters: more specific first)
    let intent = "general";
    if (isGreetingOnly) {
      intent = "greeting";
    } else if (/(wallet|balance|fund|withdraw|paystack|money|payment)/i.test(lower)) {
      intent = "wallet";
    } else if (/(book|booking|job|request|timeline|status)/i.test(lower)) {
      intent = "booking";
    } else if (/(provider|worker|artisan|plumber|driver|cleaner|hire|service)/i.test(lower)) {
      intent = "providers";
    } else if (/(account|login|register|sign ?up|verify|verification|email code|spam)/i.test(lower)) {
      intent = "account";
    }

    const suggestions = [];

    if (intent === "providers") {
      suggestions.push({
        type: "action",
        action: "search_providers",
        label: "Search providers",
        description: "Use smart search to find providers that match your request.",
        payload: {
          query: text,
          keywords,
        },
      });
      suggestions.push({
        type: "hint",
        label: "Tip",
        description: "You can narrow results by category and location on the providers page.",
      });
    } else if (intent === "wallet") {
      suggestions.push({
        type: "info",
        label: "Wallet help",
        description: "You can view your wallet balance on your dashboard and fund it via the wallet section.",
      });
      suggestions.push({
        type: "action",
        action: "open_wallet",
        label: "Go to wallet",
        description: "Open the wallet section to check balance and transactions.",
      });
    } else if (intent === "booking") {
      suggestions.push({
        type: "info",
        label: "Booking help",
        description: "Use the bookings page to track status and job timeline between you and the provider.",
      });
      suggestions.push({
        type: "action",
        action: "open_bookings",
        label: "View my bookings",
        description: "Open your bookings page to see current jobs.",
      });
    } else if (intent === "account") {
      suggestions.push({
        type: "info",
        label: "Account & email",
        description: "You can register, login, and verify your email from the main site. If emails land in spam, mark them as 'Not spam' and add the sender to contacts.",
      });
    } else if (intent === "greeting") {
      suggestions.push({
        type: "info",
        label: "Tip",
        description: "Tell me what you want to do, for example: 'find a cleaner near me' or 'check my wallet balance'.",
      });
    } else {
      suggestions.push({
        type: "info",
        label: "Getting started",
        description: "You can search providers, create bookings, chat, and manage payments with your wallet.",
      });
    }

    const replyParts = [];

    // Very short queries with no clear intent – ask for clarification
    if (!isGreetingOnly && text.length < 5 && intent === "general") {
      replyParts.push("Can you share a bit more detail about what you need? For example: 'find a plumber in Ikeja' or 'check my wallet balance'.");
    } else if (intent === "greeting") {
      replyParts.push("Hi! I'm the SkillConnect assistant.");
      replyParts.push("I can help you find providers, manage bookings, or answer basic wallet and account questions.");
      replyParts.push("Tell me what you want to do, for example: 'find a driver in Abuja' or 'view my bookings'.");
    } else if (intent === "providers") {
      replyParts.push("I can help you find suitable providers.");
      if (keywords.length) replyParts.push(`I picked up these keywords: ${keywords.join(", ")}.`);
      replyParts.push("I'll run a smart search when you tap the suggestion, and you can refine by category and location.");
    } else if (intent === "wallet") {
      replyParts.push("It sounds like you have a wallet or payment question.");
      replyParts.push("Open your wallet from the dashboard to check balance, recent transactions, and funding options.");
      replyParts.push("If a payment looks stuck, give it a few minutes and refresh the payments or wallet page.");
    } else if (intent === "booking") {
      replyParts.push("You seem to be asking about bookings or job status.");
      replyParts.push("Use the bookings page to see your job timeline and, when available, confirm work or release payments.");
    } else if (intent === "account") {
      replyParts.push("You seem to be asking about your account or email.");
      replyParts.push("You can register or log in from the main site, then verify your email from the link we send.");
      replyParts.push("If you don't see the email, check your spam folder and mark it as 'Not spam' so future messages arrive in your inbox.");
    } else {
      replyParts.push("I can assist with finding providers, bookings, chat, and wallet questions.");
      replyParts.push("Tell me what you want to do, for example: 'find a cleaner in Lekki tomorrow'.");
    }

    const reply = replyParts.join(" ");

    res.json({
      intent,
      keywords,
      reply,
      suggestions,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to process AI chat message", error: e?.message || e });
  }
};

export const deleteMe = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If this user owns an organization account, remove the organization and its dependent data.
    const organizationId = user.organizationId;
    if (organizationId) {
      await Promise.all([
        FormResponse.deleteMany({ organization: organizationId }),
        FormDefinition.deleteMany({ organization: organizationId }),
      ]);
      await Organization.deleteOne({ _id: organizationId });
    }

    // Remove references to this user from any remaining organizations.
    await Promise.all([
      Organization.updateMany({ admins: userId }, { $pull: { admins: userId } }),
      Organization.updateMany({ staff: userId }, { $pull: { staff: userId } }),
      Organization.updateMany({ ownerUser: userId }, { $unset: { ownerUser: "" } }),
    ]);

    // Cascade delete user-related entities across the system.
    await Promise.all([
      Booking.deleteMany({ $or: [{ providerId: userId }, { clientId: userId }] }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      Transaction.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      Wallet.deleteOne({ user: userId }),
      Product.deleteMany({ providerId: userId }),
      FormResponse.deleteMany({ submittedBy: userId }),
      FormDefinition.updateMany({ createdBy: userId }, { $unset: { createdBy: "" } }),
    ]);

    await User.deleteOne({ _id: userId });

    // Best-effort send confirmation email; failures are logged but do not block deletion
    if (user.email) {
      const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
          <h2 style="margin-bottom: 8px;">Your SkillConnect account has been deleted</h2>
          <p style="margin: 0 0 12px 0;">This is a confirmation that your SkillConnect account associated with this email address has been deleted.</p>
          <p style="margin: 0 0 12px 0;">Any active bookings, chats, or wallet balances may no longer be accessible from this account.</p>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">If you did not perform this action, please contact support immediately.</p>
        </div>`;
      try {
        await sendEmail(user.email, "Your SkillConnect account has been deleted", html);
      } catch {
        // sendEmail already logs internally
      }
    }

    res.json({ message: "Account deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete account", error: e?.message || e });
  }
};

export const becomeProvider = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure multi-role array exists
    let roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [];
    if (!roles.length && user.role) roles = [user.role];

    if (roles.includes("provider")) {
      return res.status(400).json({ message: "Your account is already a provider" });
    }

    // By design, a provider can always act as a client
    if (!roles.includes("client")) roles.push("client");
    roles.push("provider");
    user.roles = Array.from(new Set(roles));
    user.role = "provider";

    const {
      providerType,
      providerMode,
      categories,
      bio,
      city,
      state,
      country,
      social,
      instagram,
      facebook,
      tiktok,
      whatsapp,
      website,
    } = req.body || {};

    if (providerType) user.providerType = providerType;
    if (providerMode) user.providerMode = providerMode;
    if (Array.isArray(categories) && categories.length) user.categories = categories;
    if (bio) user.bio = bio;

    if (city || state || country) {
      user.location = {
        ...(user.location || {}),
        city,
        state,
        country,
      };
    }

    const socialPayload = {
      instagram: social?.instagram ?? instagram,
      facebook: social?.facebook ?? facebook,
      tiktok: social?.tiktok ?? tiktok,
      whatsapp: social?.whatsapp ?? whatsapp,
      website: social?.website ?? website,
    };
    if (Object.values(socialPayload).some((v) => v)) {
      user.social = socialPayload;
    }

    await user.save();

    res.json({
      message: "Account upgraded to provider",
      user,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to enable provider role", error: e?.message || e });
  }
};
