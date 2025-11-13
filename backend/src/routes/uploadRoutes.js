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
    res.json({ avatarUrl: url });
  } catch (e) { res.status(500).json({ message: "Upload failed", error: e }); }
});

export default router;
