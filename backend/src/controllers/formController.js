import fs from "fs";
import path from "path";
import FormDefinition from "../models/formDefinition.js";
import FormResponse from "../models/formResponse.js";
import Organization from "../models/organization.js";

function isOrgAdminOrStaff(user, org) {
  if (!user?._id) return false;
  if (user.role === "admin") return true; // global admin
  const idStr = String(user._id);
  return org.admins.some((id) => String(id) === idStr) || org.staff.some((id) => String(id) === idStr);
}

async function loadOrgForForm(formId) {
  const form = await FormDefinition.findById(formId);
  if (!form) return { form: null, org: null };
  const org = await Organization.findById(form.organization);
  return { form, org };
}

export const createForm = async (req, res) => {
  try {
    const { organizationId, name, description, fields, status, allowAnonymous } = req.body || {};
    if (!organizationId) return res.status(400).json({ message: "organizationId is required" });
    if (!name) return res.status(400).json({ message: "name is required" });

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, { ...org.toObject(), staff: [], admins: org.admins })) {
      return res.status(403).json({ message: "Only organization admins can create forms" });
    }

    const normalizedFields = Array.isArray(fields) ? fields.map((f, index) => ({
      id: f.id || f.name || `field_${index}`,
      label: f.label || f.name || `Field ${index + 1}`,
      type: f.type || "text",
      required: !!f.required,
      placeholder: f.placeholder,
      helpText: f.helpText,
      options: Array.isArray(f.options) ? f.options : [],
      min: typeof f.min === "number" ? f.min : undefined,
      max: typeof f.max === "number" ? f.max : undefined,
      pattern: f.pattern,
      order: typeof f.order === "number" ? f.order : index,
    })) : [];

    const form = await FormDefinition.create({
      organization: organizationId,
      name,
      description,
      status: status || "draft",
      allowAnonymous: !!allowAnonymous,
      fields: normalizedFields,
      createdBy: req.user?._id,
    });

    res.status(201).json(form);
  } catch (e) {
    res.status(500).json({ message: "Failed to create form", error: e?.message || e });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    const { name, description, status, allowAnonymous, fields } = req.body || {};
    if (name != null) form.name = name;
    if (description != null) form.description = description;
    if (status != null) form.status = status;
    if (allowAnonymous != null) form.allowAnonymous = !!allowAnonymous;
    if (Array.isArray(fields)) {
      form.fields = fields.map((f, index) => ({
        id: f.id || f.name || `field_${index}`,
        label: f.label || f.name || `Field ${index + 1}`,
        type: f.type || "text",
        required: !!f.required,
        placeholder: f.placeholder,
        helpText: f.helpText,
        options: Array.isArray(f.options) ? f.options : [],
        min: typeof f.min === "number" ? f.min : undefined,
        max: typeof f.max === "number" ? f.max : undefined,
        pattern: f.pattern,
        order: typeof f.order === "number" ? f.order : index,
      }));
    }

    await form.save();
    res.json(form);
  } catch (e) {
    res.status(500).json({ message: "Failed to update form", error: e?.message || e });
  }
};

export const listForms = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const user = req.user;

    // Global admins can see all forms, optionally filtered by organization
    if (user?.role === "admin") {
      const filter = {};
      if (organizationId) filter.organization = organizationId;
      const forms = await FormDefinition.find(filter).sort({ createdAt: -1 });
      return res.json({ forms });
    }

    // Non-admins: restrict to organizations where they are admins or staff
    let orgIds = [];

    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      if (!isOrgAdminOrStaff(user, org)) {
        return res.status(403).json({ message: "Access denied" });
      }
      orgIds = [org._id];
    } else if (user?._id) {
      const orgs = await Organization.find({
        $or: [
          { admins: user._id },
          { staff: user._id },
        ],
      }).select("_id");
      orgIds = orgs.map((o) => o._id);
    }

    if (!orgIds.length) {
      return res.json({ forms: [] });
    }

    const forms = await FormDefinition.find({ organization: { $in: orgIds } }).sort({ createdAt: -1 });
    res.json({ forms });
  } catch (e) {
    res.status(500).json({ message: "Failed to list forms", error: e?.message || e });
  }
};

export const getForm = async (req, res) => {
  try {
    const form = await FormDefinition.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (e) {
    res.status(500).json({ message: "Failed to get form", error: e?.message || e });
  }
};

function validateValueByField(field, rawValue) {
  if (rawValue == null || rawValue === "") {
    if (field.required) {
      return { ok: false, error: `${field.label} is required` };
    }
    return { ok: true, value: null };
  }

  const type = field.type;
  if (type === "text" || type === "textarea") {
    const value = String(rawValue);
    if (typeof field.min === "number" && value.length < field.min) {
      return { ok: false, error: `${field.label} must be at least ${field.min} characters` };
    }
    if (typeof field.max === "number" && value.length > field.max) {
      return { ok: false, error: `${field.label} must be at most ${field.max} characters` };
    }
    if (field.pattern) {
      try {
        const re = new RegExp(field.pattern);
        if (!re.test(value)) return { ok: false, error: `${field.label} has an invalid format` };
      } catch {
        // ignore invalid regex
      }
    }
    return { ok: true, value };
  }

  if (type === "number") {
    const num = Number(rawValue);
    if (!Number.isFinite(num)) {
      return { ok: false, error: `${field.label} must be a number` };
    }
    if (typeof field.min === "number" && num < field.min) {
      return { ok: false, error: `${field.label} must be at least ${field.min}` };
    }
    if (typeof field.max === "number" && num > field.max) {
      return { ok: false, error: `${field.label} must be at most ${field.max}` };
    }
    return { ok: true, value: num };
  }

  if (type === "select" || type === "radio") {
    const value = String(rawValue);
    if (Array.isArray(field.options) && field.options.length && !field.options.includes(value)) {
      return { ok: false, error: `${field.label} has an invalid value` };
    }
    return { ok: true, value };
  }

  if (type === "checkbox") {
    const arr = Array.isArray(rawValue) ? rawValue : [rawValue];
    const value = arr.map((v) => String(v));
    if (field.required && value.length === 0) {
      return { ok: false, error: `${field.label} is required` };
    }
    if (Array.isArray(field.options) && field.options.length) {
      const invalid = value.filter((v) => !field.options.includes(v));
      if (invalid.length) {
        return { ok: false, error: `${field.label} has invalid selections` };
      }
    }
    return { ok: true, value };
  }

  if (type === "date" || type === "time" || type === "datetime") {
    const value = String(rawValue);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: `${field.label} has an invalid date/time` };
    }
    return { ok: true, value };
  }

  // file is handled separately
  return { ok: true, value: rawValue };
}

function escapeCsvField(value) {
  if (value == null) return "";
  const str = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(str)) {
    return `"${str}"`;
  }
  return str;
}

export const submitFormResponse = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    if (!form.allowAnonymous && !req.user?._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const fieldMap = new Map();
    form.fields.forEach((f) => fieldMap.set(f.id, f));

    const errors = [];
    const values = {};

    // Non-file fields from body
    for (const [key, raw] of Object.entries(req.body || {})) {
      const field = fieldMap.get(key);
      if (!field || field.type === "file") continue;
      const result = validateValueByField(field, raw);
      if (!result.ok) {
        errors.push({ fieldId: field.id, message: result.error });
      } else if (result.value !== null) {
        values[field.id] = result.value;
      }
    }

    // Required fields that weren't present in body at all
    form.fields.forEach((field) => {
      if (field.type === "file") return; // handled separately
      if (field.required && values[field.id] == null && !(field.id in (req.body || {}))) {
        errors.push({ fieldId: field.id, message: `${field.label} is required` });
      }
    });

    // Files (handled by multer before this controller)
    const filesPayload = [];
    const anyFiles = Array.isArray(req.files) ? req.files : [];
    for (const f of anyFiles) {
      const field = fieldMap.get(f.fieldname);
      if (!field || field.type !== "file") continue;
      filesPayload.push({
        fieldId: field.id,
        originalName: f.originalname,
        storedPath: f.path.replace(process.cwd(), ""),
        mimeType: f.mimetype,
        size: f.size,
      });
    }

    // Required file fields validation
    form.fields.forEach((field) => {
      if (field.type !== "file" || !field.required) return;
      const has = filesPayload.some((f) => f.fieldId === field.id);
      if (!has) {
        errors.push({ fieldId: field.id, message: `${field.label} is required` });
      }
    });

    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const responseDoc = await FormResponse.create({
      form: form._id,
      organization: org._id,
      submittedBy: req.user?._id || null,
      values,
      files: filesPayload,
    });

    res.status(201).json(responseDoc);
  } catch (e) {
    res.status(500).json({ message: "Failed to submit response", error: e?.message || e });
  }
};

export const listFormResponses = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    const responses = await FormResponse.find({ form: form._id })
      .populate("submittedBy", "email name")
      .sort({ createdAt: -1 });
    res.json({ responses });
  } catch (e) {
    res.status(500).json({ message: "Failed to list responses", error: e?.message || e });
  }
};

export const exportFormResponsesCsv = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    const responses = await FormResponse.find({ form: form._id })
      .populate("submittedBy", "email name")
      .sort({ createdAt: 1 });

    const fields = Array.isArray(form.fields) ? form.fields : [];

    const headerCols = [
      "responseId",
      "createdAt",
      "submittedByName",
      "submittedByEmail",
      ...fields.map((f) => f.label || f.id || "field"),
    ];

    const lines = [];
    lines.push(headerCols.map(escapeCsvField).join(","));

    for (const resp of responses) {
      const row = [];
      row.push(resp._id ? String(resp._id) : "");
      row.push(resp.createdAt ? resp.createdAt.toISOString() : "");
      const submittedBy = resp.submittedBy || {};
      row.push(submittedBy.name || "");
      row.push(submittedBy.email || "");

      for (const field of fields) {
        let display = "";
        if (field.type === "file") {
          const filesForField = (resp.files || []).filter((f) => String(f.fieldId) === String(field.id));
          display = filesForField.map((f) => f.originalName).join("; ");
        } else {
          let value = null;
          if (resp.values && typeof resp.values.get === "function") {
            value = resp.values.get(field.id);
          } else if (resp.values) {
            value = resp.values[field.id];
          }

          if (Array.isArray(value)) {
            display = value.join("; ");
          } else if (value != null) {
            display = String(value);
          } else {
            display = "";
          }
        }
        row.push(display);
      }

      lines.push(row.map(escapeCsvField).join(","));
    }

    const csv = "\uFEFF" + lines.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="form-${form._id}-responses.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: "Failed to export responses", error: e?.message || e });
  }
};

export const getFormResponse = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    const resp = await FormResponse.findOne({ _id: req.params.responseId, form: form._id });
    if (!resp) return res.status(404).json({ message: "Response not found" });
    res.json(resp);
  } catch (e) {
    res.status(500).json({ message: "Failed to get response", error: e?.message || e });
  }
};

export const deleteFormResponse = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    const resp = await FormResponse.findOne({ _id: req.params.responseId, form: form._id });
    if (!resp) return res.status(404).json({ message: "Response not found" });

    // Best-effort delete files from disk
    if (Array.isArray(resp.files)) {
      for (const f of resp.files) {
        if (!f.storedPath) continue;
        const full = path.join(process.cwd(), f.storedPath.replace(/^\\+|\/+/, ""));
        try {
          if (fs.existsSync(full)) fs.unlinkSync(full);
        } catch {
          // ignore file deletion errors
        }
      }
    }

    await resp.deleteOne();
    res.json({ message: "Response deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete response", error: e?.message || e });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const { form, org } = await loadOrgForForm(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    if (!isOrgAdminOrStaff(req.user, org)) return res.status(403).json({ message: "Access denied" });

    // Delete all responses
    await FormResponse.deleteMany({ form: form._id });

    // Delete the form definition
    await form.deleteOne();

    res.json({ message: "Form and all responses deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete form", error: e?.message || e });
  }
};
