import Organization from "../models/organization.js";
import User from "../models/user.js";

function slugifyName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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
    const { name, slug: providedSlug, sector, description, adminUserIds } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });

    const admins = Array.isArray(adminUserIds) && adminUserIds.length
      ? adminUserIds
      : [req.user._id];

    let slug = providedSlug && String(providedSlug).trim();
    if (!slug) {
      const base = slugifyName(name);
      slug = base || undefined;
    }
    if (slug) {
      let candidate = slug;
      for (let i = 0; i < 10; i += 1) {
        const existing = await Organization.findOne({ slug: candidate });
        if (!existing) {
          slug = candidate;
          break;
        }
        candidate = `${slug}-${i + 1}`;
      }
    }

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

export const updateOrganizationProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const org = await Organization.findById(id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const roles = Array.isArray(req.user?.roles) && req.user.roles.length
      ? req.user.roles
      : (req.user?.role ? [req.user.role] : []);
    const isGlobalAdmin = roles.includes("admin");
    const isOrgAdmin = org.admins.some((uid) => String(uid) === String(req.user._id));

    if (!isGlobalAdmin && !isOrgAdmin) {
      return res.status(403).json({ message: "Only organization admins can update this organization" });
    }

    const {
      name,
      sector,
      description,
      phone,
      website,
      logo,
      address,
      tagline,
      services,
      teamMembers,
      achievements,
      projects,
      ratingScore,
      ratingCount,
      reviews,
      partners,
      media,
      certificates,
      updates,
    } = req.body || {};

    if (typeof name === "string" && name.trim()) org.name = name.trim();
    if (sector !== undefined) org.sector = sector || undefined;
    if (description !== undefined) org.description = description || undefined;
    if (phone !== undefined) org.phone = phone || undefined;
    if (website !== undefined) org.website = website || undefined;
    if (logo !== undefined) org.logo = logo || undefined;
    if (address !== undefined) org.address = address || undefined;
    if (tagline !== undefined) org.tagline = tagline || undefined;
    if (Array.isArray(services)) org.services = services;
    if (Array.isArray(teamMembers)) org.teamMembers = teamMembers;
    if (Array.isArray(achievements)) org.achievements = achievements;
    if (Array.isArray(projects)) org.projects = projects;
    if (ratingScore !== undefined) org.ratingScore = ratingScore;
    if (ratingCount !== undefined) org.ratingCount = ratingCount;
    if (Array.isArray(reviews)) org.reviews = reviews;
    if (Array.isArray(partners)) org.partners = partners;
    if (Array.isArray(media)) org.media = media;
    if (Array.isArray(certificates)) org.certificates = certificates;
    if (Array.isArray(updates)) org.updates = updates;

    await org.save();
    res.json(org);
  } catch (e) {
    res.status(500).json({ message: "Failed to update organization", error: e?.message || e });
  }
};

export const listPublicOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find(
      { accountType: "organization" },
      "name slug tagline sector description logo createdAt",
    ).sort({ createdAt: -1 }).limit(20);
    res.json({ organizations: orgs });
  } catch (e) {
    res.status(500).json({ message: "Failed to list organizations", error: e?.message || e });
  }
};

export const getOrganizationBySlugPublic = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "slug is required" });

    const org = await Organization.findOne(
      { $or: [{ slug }, { _id: slug }] },
      "name slug tagline sector description email phone website logo address services teamMembers achievements projects ratingScore ratingCount reviews partners media certificates updates createdAt",
    );
    if (!org) return res.status(404).json({ message: "Organization not found" });

    res.json({ organization: org });
  } catch (e) {
    res.status(500).json({ message: "Failed to get organization", error: e?.message || e });
  }
};
