import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrganization, listMyOrganizations, getOrganization, updateOrganizationMembers, listPublicOrganizations, getOrganizationBySlugPublic } from "../controllers/organizationController.js";

const router = express.Router();

router.get("/public", listPublicOrganizations);
router.get("/public/:slug", getOrganizationBySlugPublic);
router.post("/", protect, createOrganization);
router.get("/mine", protect, listMyOrganizations);
router.get("/:id", protect, getOrganization);
router.put("/:id/members", protect, updateOrganizationMembers);

export default router;
