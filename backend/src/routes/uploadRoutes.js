import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import User from "../models/user.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.put("/:id/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    const outDir = path.join(process.cwd(), "backend", "src", "uploads", req.params.id);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `avatar.webp`);
    const image = sharp(req.file.buffer).resize(256, 256, { fit: "cover" }).webp({ quality: 85 });
    await image.toFile(outPath);
    const url = `/uploads/${req.params.id}/avatar.webp`;
    await User.findByIdAndUpdate(req.params.id, { avatarUrl: url });
    res.json({ avatarUrl: url, user: { avatarUrl: url } });
  } catch (e) { res.status(500).json({ message: "Upload failed", error: e }); }
});

// Generic product image upload for providers; returns a public URL only
router.post("/:id/product-image", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    const providerId = req.params.id;
    const outDir = path.join(process.cwd(), "backend", "src", "uploads", "products", providerId);
    fs.mkdirSync(outDir, { recursive: true });
    const filename = `product-${Date.now()}.webp`;
    const outPath = path.join(outDir, filename);
    const image = sharp(req.file.buffer).resize(800, 800, { fit: "inside" }).webp({ quality: 82 });
    await image.toFile(outPath);
    const url = `/uploads/products/${providerId}/${filename}`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ message: "Upload failed", error: e });
  }
});

export default router;
