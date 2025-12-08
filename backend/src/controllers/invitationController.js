import crypto from "crypto";
import Invitation from "../models/invitation.js";
import Organization from "../models/organization.js";
import User from "../models/user.js";

// Generate a unique token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// POST /api/organizations/:orgId/invite
export const sendInvitation = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email, role } = req.body;
    const inviterId = req.user._id;

    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({ message: "role must be admin or staff" });
    }

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // Only owners or admins can invite
    const isOwner = String(org.ownerUser) === String(inviterId);
    const isAdmin = org.admins.some((id) => String(id) === String(inviterId));
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only owners or admins can invite" });
    }

    // Prevent re-inviting existing members
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember =
        String(org.ownerUser) === String(existingUser._id) ||
        org.admins.some((id) => String(id) === String(existingUser._id)) ||
        org.staff.some((id) => String(id) === String(existingUser._id));
      if (alreadyMember) {
        return res.status(400).json({ message: "User is already a member" });
      }
    }

    // Delete any existing pending invitation for this email/org
    await Invitation.deleteMany({
      organizationId: orgId,
      email,
      acceptedAt: { $exists: false },
    });

    const token = generateToken();
    const invitation = await Invitation.create({
      organizationId: orgId,
      email,
      role,
      token,
      invitedBy: inviterId,
    });

    // TODO: send email with invitation link containing token
    console.log(`Invitation token for ${email}: ${token}`);

    return res.status(201).json({ invitation });
  } catch (e) {
    return res.status(500).json({ message: "Failed to send invitation", error: e?.message || e });
  }
};

// POST /api/invitations/:token/accept
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user?._id;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.acceptedAt) return res.status(400).json({ message: "Invitation already accepted" });
    if (invitation.isExpired) return res.status(400).json({ message: "Invitation expired" });

    // Ensure the logged-in user’s email matches the invitation email
    const user = await User.findById(userId);
    if (!user || user.email !== invitation.email) {
      return res.status(403).json({ message: "Invitation is for a different email address" });
    }

    const org = await Organization.findById(invitation.organizationId);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // Add user to appropriate role array
    if (invitation.role === "admin") {
      if (!org.admins.includes(userId)) {
        org.admins.push(userId);
      }
    } else if (invitation.role === "staff") {
      if (!org.staff.includes(userId)) {
        org.staff.push(userId);
      }
    }

    await org.save();

    invitation.acceptedAt = new Date();
    await invitation.save();

    return res.json({ message: "Invitation accepted", role: invitation.role });
  } catch (e) {
    return res.status(500).json({ message: "Failed to accept invitation", error: e?.message || e });
  }
};

// GET /api/organizations/:orgId/collaborators
export const listCollaborators = async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user?._id;

    const org = await Organization.findById(orgId)
      .populate("ownerUser", "name email")
      .populate("admins", "name email")
      .populate("staff", "name email");

    if (!org) return res.status(404).json({ message: "Organization not found" });

    const isOwner = String(org.ownerUser._id) === String(userId);
    const isAdmin = org.admins.some((u) => String(u._id) === String(userId));
    const isStaff = org.staff.some((u) => String(u._id) === String(userId));

    if (!isOwner && !isAdmin && !isStaff) {
      return res.status(403).json({ message: "Not a member of this organization" });
    }

    const collaborators = {
      owner: org.ownerUser,
      admins: org.admins,
      staff: org.staff,
    };

    return res.json({ collaborators });
  } catch (e) {
    return res.status(500).json({ message: "Failed to list collaborators", error: e?.message || e });
  }
};

// DELETE /api/organizations/:orgId/collaborators/:userId
export const removeCollaborator = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const requesterId = req.user._id;

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const isOwner = String(org.ownerUser) === String(requesterId);
    const isAdmin = org.admins.some((id) => String(id) === String(requesterId));
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only owners or admins can remove collaborators" });
    }

    // Cannot remove the owner
    if (String(org.ownerUser) === String(userId)) {
      return res.status(400).json({ message: "Cannot remove the organization owner" });
    }

    // Remove from admins or staff arrays
    const adminIdx = org.admins.findIndex((id) => String(id) === String(userId));
    const staffIdx = org.staff.findIndex((id) => String(id) === String(userId));

    let removed = false;
    if (adminIdx !== -1) {
      org.admins.splice(adminIdx, 1);
      removed = true;
    } else if (staffIdx !== -1) {
      org.staff.splice(staffIdx, 1);
      removed = true;
    }

    if (!removed) {
      return res.status(404).json({ message: "User is not a collaborator" });
    }

    await org.save();

    // Cancel any pending invitations for this user/email
    const targetUser = await User.findById(userId);
    if (targetUser) {
      await Invitation.deleteMany({
        organizationId: orgId,
        email: targetUser.email,
        acceptedAt: { $exists: false },
      });
    }

    return res.json({ message: "Collaborator removed" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to remove collaborator", error: e?.message || e });
  }
};
