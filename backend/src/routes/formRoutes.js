import express from "express";
import multer from "multer";
import path from "path";
import { protect, maybeAuth } from "../middleware/authMiddleware.js";
import {
  createForm,
  updateForm,
  listForms,
  getForm,
  submitFormResponse,
  listFormResponses,
  getFormResponse,
  deleteFormResponse,
  exportFormResponsesCsv,
  deleteForm,
} from "../controllers/formController.js";

const router = express.Router();

// Simple disk storage for form uploads, namespaced by form id
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const formId = req.params.id || "general";
    const dest = path.join(process.cwd(), "src", "uploads", "forms", formId);
    cb(null, dest);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// Form definitions (admin/org-level)
router.post("/", protect, createForm);
router.put("/:id", protect, updateForm);
router.get("/", protect, listForms);
router.get("/:id", getForm); // public definition for rendering forms
router.delete("/:id", protect, deleteForm);

// Form responses
router.get("/:id/export/csv", protect, exportFormResponsesCsv);

router.post(
  "/:id/submissions",
  maybeAuth,
  upload.any(), // handle file fields; auth is optional depending on form.allowAnonymous
  submitFormResponse,
);

router.get("/:id/submissions", protect, listFormResponses);
router.get("/:id/submissions/:responseId", protect, getFormResponse);
router.delete("/:id/submissions/:responseId", protect, deleteFormResponse);

export default router;
