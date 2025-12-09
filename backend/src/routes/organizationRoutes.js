import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import { createOrganization, listMyOrganizations, getOrganization, updateOrganizationMembers, listPublicOrganizations, getOrganizationBySlugPublic, updateOrganizationProfile } from "../controllers/organizationController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/public", listPublicOrganizations);
router.get("/public/:slug", getOrganizationBySlugPublic);
router.post("/", protect, createOrganization);
router.get("/mine", protect, listMyOrganizations);
router.put("/:id/profile", protect, updateOrganizationProfile);
router.get("/:id", protect, getOrganization);
router.put("/:id/members", protect, updateOrganizationMembers);

// Upload and process organization logo image, returning a public URL.
// The client should then persist this URL via the normal profile update endpoint.
router.post("/:id/logo", protect, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });

    const orgId = req.params.id;
    const outDir = path.join(process.cwd(), "src", "uploads", "organizations", orgId);
    fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, "logo.webp");
    const image = sharp(req.file.buffer)
      .resize(256, 256, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 85 });
    await image.toFile(outPath);

    const url = `/uploads/organizations/${orgId}/logo.webp`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ message: "Logo upload failed", error: e?.message || e });
  }
});

export default router;
