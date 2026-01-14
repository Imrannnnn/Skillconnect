import express from "express";
import User from "../models/user.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadPublic } from "../middleware/cloudinaryMiddleware.js";

const router = express.Router();

// 1. Avatar Upload
router.put("/:id/avatar", protect, uploadPublic.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Cloudinary returns file info in req.file. path is the secure_url
    const url = req.file.path;

    await User.findByIdAndUpdate(req.params.id, { avatarUrl: url });
    res.json({ avatarUrl: url, user: { avatarUrl: url } });
  } catch (e) {
    console.error("Avatar upload error:", e);
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

// 2. Generic product image upload (Public)
router.post("/:id/product-image", protect, uploadPublic.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ url: req.file.path });
  } catch (e) {
    console.error("Product image upload error:", e);
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

// 3. Content Image/Video
// Note: 'image' field name is used by the frontend, but we allow videos too
router.post("/content-image", protect, uploadPublic.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Check if it was a video or image based on Cloudinary response if needed
    // req.file.mimetype or req.file.resource_type (if provided by storage engine)

    res.json({ url: req.file.path });
  } catch (e) {
    console.error("Content upload error:", e);
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default router;
