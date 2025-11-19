import Organization from "../models/organization.js";
import User from "../models/user.js";

function ensureAdminRole(req, res) {
  const roles = Array.isArray(req.user?.roles) && req.user.roles.length
    ? req.user.roles
    : (req.user?.role ? [req.user.role] : []);
  if (!req.user || !roles.includes("admin")) {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
}

export const createOrganization = async (req, res) => {
  try {
    if (!ensureAdminRole(req, res)) return;
    const { name, slug, sector, description, adminUserIds } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });

    const admins = Array.isArray(adminUserIds) && adminUserIds.length
      ? adminUserIds
      : [req.user._id];

    const org = await Organization.create({
      name,
      slug,
      sector,
      description,
      admins,
    });
    res.status(201).json(org);
  } catch (e) {
    res.status(500).json({ message: "Failed to create organization", error: e?.message || e });
  }
};

export const listMyOrganizations = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const userId = req.user._id;
    const orgs = await Organization.find({ $or: [
      { admins: userId },
      { staff: userId },
    ] }).sort({ createdAt: -1 });
    res.json({ organizations: orgs });
  } catch (e) {
    res.status(500).json({ message: "Failed to list organizations", error: e?.message || e });
  }
};

export const getOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    // Basic membership check: must be admin or staff or global admin
    if (req.user?.role !== "admin" && !org.admins.some((id) => String(id) === String(req.user?._id)) && !org.staff.some((id) => String(id) === String(req.user?._id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(org);
  } catch (e) {
    res.status(500).json({ message: "Failed to get organization", error: e?.message || e });
  }
};

export const updateOrganizationMembers = async (req, res) => {
  try {
    if (!ensureAdminRole(req, res)) return;
    const { admins, staff } = req.body || {};
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    if (!org.admins.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({ message: "Only organization admins can update members" });
    }

    if (Array.isArray(admins)) org.admins = admins;
    if (Array.isArray(staff)) org.staff = staff;
    await org.save();
    res.json(org);
  } catch (e) {
    res.status(500).json({ message: "Failed to update organization members", error: e?.message || e });
  }
};
