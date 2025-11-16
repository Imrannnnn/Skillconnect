import User from "../models/user.js";

export const getAllProviders = async (req, res) => {
  try {
    const { category, providerType } = req.query;
    const filter = { role: "provider" };
    if (category) filter.categories = { $regex: new RegExp(category, "i") };
    if (providerType) filter.providerType = providerType;
    const providers = await User.find(filter).sort({ ratingAvg: -1, ratingCount: -1, createdAt: -1 });
    res.json(providers);
  } catch (error) { res.status(500).json({ message: "Failed to fetch providers", error }); }
};

export const getProvider = async (req, res) => {
  try {
    const p = await User.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (error) { res.status(500).json({ message: "Failed to fetch provider", error }); }
};

// Fetch provider by public handle (for branded URLs)
export const getProviderByHandle = async (req, res) => {
  try {
    const handle = String(req.params.handle || "").trim();
    if (!handle) return res.status(400).json({ message: "Handle is required" });
    const p = await User.findOne({ handle, role: "provider" });
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (error) { res.status(500).json({ message: "Failed to fetch provider by handle", error }); }
};

export const updateProvider = async (req, res) => {
  try {
    const allowed = ["bio", "categories", "providerType", "providerMode", "latitude", "longitude", "location", "name", "social", "handle"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    // Map flat city/state/country fields into location object when provided
    const city = req.body.city;
    const state = req.body.state;
    const country = req.body.country;
    if (city || state || country) {
      update.location = {
        ...(update.location || {}),
        city,
        state,
        country,
      };
    }

    // Map flat social fields into social object
    const social = req.body.social || {};
    const socialPayload = {
      instagram: social.instagram ?? req.body.instagram,
      facebook: social.facebook ?? req.body.facebook,
      tiktok: social.tiktok ?? req.body.tiktok,
      whatsapp: social.whatsapp ?? req.body.whatsapp,
      website: social.website ?? req.body.website,
    };
    if (Object.values(socialPayload).some((v) => v)) {
      update.social = socialPayload;
    }
    // If handle is being updated, enforce basic formatting and uniqueness
    if (update.handle) {
      const raw = String(update.handle).trim();
      const normalized = raw.toLowerCase();
      if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
        return res.status(400).json({ message: "Handle must be 3-30 characters of a-z, 0-9, '-' or '_'" });
      }
      const existing = await User.findOne({ handle: normalized, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ message: "This handle is already taken" });
      }
      update.handle = normalized;
    }

    const p = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (error) { res.status(500).json({ message: "Failed to update provider", error }); }
};

export const deleteProvider = async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch (error) { res.status(500).json({ message: "Failed to delete provider", error }); }
};

export const rateProvider = async (req, res) => {
  try {
    const { rating } = req.body; const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });
    const prov = await User.findById(req.params.id);
    if (!prov || prov.role !== "provider") return res.status(404).json({ message: "Provider not found" });
    const newCount = (prov.ratingCount || 0) + 1;
    const newAvg = ((prov.ratingAvg || 0) * (prov.ratingCount || 0) + r) / newCount;
    prov.ratingAvg = Number(newAvg.toFixed(2));
    prov.ratingCount = newCount;
    await prov.save();
    res.json({ message: "Rating submitted", provider: prov });
  } catch (error) { res.status(500).json({ message: "Failed to rate provider", error }); }
};

// Increment simple profile view counter for analytics
export const visitProvider = async (req, res) => {
  try {
    const p = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { profileViews: 1 } },
      { new: true }
    );
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json({ profileViews: p.profileViews });
  } catch (error) { res.status(500).json({ message: "Failed to track visit", error }); }
};
