import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role, categories, providerType } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email & password required" });
    const exists = await User.findOne({ email }); if (exists) return res.status(400).json({ message: "Email in use" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role, categories, providerType });
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    res.status(201).json({ user, token });
  } catch (e) { res.status(500).json({ message: "Failed to register", error: e }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }); if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password || ""); if (!ok) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    res.json({ user, token });
  } catch (e) { res.status(500).json({ message: "Failed to login", error: e }); }
};
