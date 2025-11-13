import User from "../models/user.js";

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
