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
    const outDir = path.join(process.cwd(), "src", "uploads", req.params.id);
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
    const outDir = path.join(process.cwd(), "src", "uploads", "products", providerId);
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

// Content image upload: jpeg/png only, max 5MB, preserve original format and extension
router.post("/content-image", protect, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image is too large. Maximum size is 5MB." });
      }
      return res.status(400).json({ message: "Upload failed", error: err.message || err.toString() });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file" });
    }

    const { mimetype, originalname, size, buffer } = req.file;

    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Image is too large. Maximum size is 5MB." });
    }

    if (!["image/jpeg", "image/png"].includes(mimetype)) {
      return res.status(400).json({ message: "Only JPEG and PNG images are allowed." });
    }

    try {
      const safeName = originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const ext = path.extname(safeName) || (mimetype === "image/png" ? ".png" : ".jpg");
      const base = path.basename(safeName, path.extname(safeName)) || "image";
      const filename = `${base}-${Date.now()}${ext}`;

      const outDir = path.join(process.cwd(), "src", "uploads", "content");
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, filename);
      fs.writeFileSync(outPath, buffer);

      const url = `/uploads/content/${filename}`;
      return res.json({ url });
    } catch (e) {
      return res.status(500).json({ message: "Upload failed", error: e?.message || e });
    }
  });
});

export default router;
