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

export const updateProvider = async (req, res) => {
  try {
    const allowed = ["bio", "categories", "providerType", "latitude", "longitude", "location", "name"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
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
