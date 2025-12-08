import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendInvitation,
  acceptInvitation,
  listCollaborators,
  removeCollaborator,
} from "../controllers/invitationController.js";

const router = express.Router();

// Invite a collaborator (org owners or admins only)
router.post("/organizations/:orgId/invite", protect, sendInvitation);

// Accept an invitation (logged-in user, token in URL)
router.post("/invitations/:token/accept", protect, acceptInvitation);

// List collaborators (org members only)
router.get("/organizations/:orgId/collaborators", protect, listCollaborators);

// Remove a collaborator (org owners or admins only)
router.delete("/organizations/:orgId/collaborators/:userId", protect, removeCollaborator);

export default router;
