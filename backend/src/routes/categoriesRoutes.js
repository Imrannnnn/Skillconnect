import express from "express";
import User from "../models/user.js";
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const providers = await User.find({ role: "provider" }, { categories: 1 });
    const set = new Set();
    providers.forEach(p => (p.categories || []).forEach(c => set.add(String(c).trim())));
    res.json({ categories: Array.from(set).sort((a,b)=>a.localeCompare(b)) });
  } catch (e) { res.status(500).json({ message: "Failed to load categories", error: e }); }
});
export default router;
